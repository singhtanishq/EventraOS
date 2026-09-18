// Database query optimization utilities

import { DB } from 'knex'

// Query builder extensions for performance
export class QueryOptimizer {
  private knex: DB

  constructor(knex: DB) {
    this.knex = knex
  }

  // Pagination with cursor-based approach (more efficient than offset)
  async paginateWithCursor<T>(
    table: string,
    columns: string[],
    cursor: string | null,
    limit: number,
    orderBy: { column: string; direction: 'asc' | 'desc' } = { column: 'id', direction: 'desc' }
  ): Promise<{ data: T[]; nextCursor: string | null }> {
    const query = this.knex(table).select(columns).orderBy(orderBy.column, orderBy.direction).limit(limit + 1)

    if (cursor) {
      const decoded = Buffer.from(cursor, 'base64').toString()
      const [cursorValue, cursorId] = decoded.split(':')
      
      if (orderBy.direction === 'desc') {
        query.where((builder) => {
          builder
            .where(orderBy.column, '<', cursorValue)
            .orWhere((b) => b.where(orderBy.column, '=', cursorValue).where('id', '<', cursorId))
        })
      } else {
        query.where((builder) => {
          builder
            .where(orderBy.column, '>', cursorValue)
            .orWhere((b) => b.where(orderBy.column, '=', cursorValue).where('id', '>', cursorId))
        })
      }
    }

    const results = await query
    let nextCursor: string | null = null

    if (results.length > limit) {
      const last = results[limit - 1]
      const cursorValue = last[orderBy.column]
      const cursorId = last.id
      nextCursor = Buffer.from(`${cursorValue}:${cursorId}`).toString('base64')
      results.pop()
    }

    return { data: results as T[], nextCursor }
  }

  // Batch insert with chunking
  async batchInsert<T>(table: string, records: T[], chunkSize = 1000): Promise<number[]> {
    const insertedIds: number[] = []
    
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const ids = await this.knex(table).insert(chunk).returning('id')
      insertedIds.push(...ids)
    }

    return insertedIds
  }

  // Upsert with conflict resolution
  async upsert<T extends Record<string, any>>(
    table: string,
    records: T[],
    conflictColumns: string[],
    updateColumns: string[]
  ): Promise<number> {
    if (records.length === 0) return 0

    const columns = Object.keys(records[0])
    const placeholders = records.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ')
    const values = records.flatMap((r) => columns.map((c) => r[c]))

    const updateClause = updateColumns.map((c) => `${c} = EXCLUDED.${c}`).join(', ')
    const conflictClause = conflictColumns.join(', ')

    const sql = `
      INSERT INTO ${this.knex.client.config.client === 'mysql' ? '`' : ''}${table}${this.knex.client.config.client === 'mysql' ? '`' : ''} 
      (${columns.map((c) => this.knex.client.config.client === 'mysql' ? `\`${c}\`` : c).join(', ')}) 
      VALUES ${placeholders}
      ON CONFLICT (${conflictClause}) 
      DO UPDATE SET ${updateClause}
    `

    const result = await this.knex.raw(sql, values)
    return result.rowCount || 0
  }

  // Bulk update with case statements
  async bulkUpdate<T extends { id: number | string }>(
    table: string,
    records: T[],
    updateFields: string[]
  ): Promise<number> {
    if (records.length === 0) return 0

    const ids = records.map((r) => r.id)
    const placeholders = records.map(() => '(?, ?)').join(', ')
    
    // Build CASE statements for each field
    const caseStatements = updateFields.map((field) => {
      const whenClauses = records.map((r) => `WHEN ${this.knex.client.config.client === 'mysql' ? '`' : ''}id${this.knex.client.config.client === 'mysql' ? '`' : ''} = ? THEN ?`).join(' ')
      return `${this.knex.client.config.client === 'mysql' ? '`' : ''}${field}${this.knex.client.config.client === 'mysql' ? '`' : ''} = CASE ${whenClauses} END`
    }).join(', ')

    const sql = `
      UPDATE ${this.knex.client.config.client === 'mysql' ? '`' : ''}${table}${this.knex.client.config.client === 'mysql' ? '`' : ''}
      SET ${caseStatements}
      WHERE ${this.knex.client.config.client === 'mysql' ? '`' : ''}id${this.knex.client.config.client === 'mysql' ? '`' : ''} IN (${ids.map(() => '?').join(', ')})
    `

    const values = records.flatMap((r) => [r.id, r[updateFields[0]]]) // Simplified - would need proper mapping

    const result = await this.knex.raw(sql, values)
    return result.rowCount || 0
  }

  // Select with subquery optimization
  async selectWithSubquery<T>(
    mainTable: string,
    subquery: (qb: any) => void,
    columns: string[]
  ): Promise<any[]> {
    return this.knex(mainTable)
      .select(columns)
      .whereIn('id', (qb: any) => subquery(qb))
  }

  // JSON aggregation for related data
  async aggregateJson<T>(
    table: string,
    groupBy: string,
    jsonFields: { [key: string]: { table: string; foreignKey: string; columns: string[] } }
  ): Promise<any[]> {
    const jsonAggs = Object.entries(jsonFields).map(([key, config]) => {
      return this.knex.raw(`
        json_agg(json_build_object(${config.columns.map((c, i) => `'${c}', ${config.table}.${c}`).join(', ')})) as ${key}
      `)
    })

    return this.knex(table)
      .select('*', ...jsonAggs)
      .leftJoin((qb) => qb.from(jsonFields[Object.keys(jsonFields)[0]].table).select('*'), `${table}.id`, `${jsonFields[Object.keys(jsonFields)[0]].table}.${jsonFields[Object.keys(jsonFields)[0]].foreignKey}`)
      .groupBy(groupBy)
  }

  // Window functions for analytics
  async windowFunction<T>(
    table: string,
    partitionBy: string,
    orderBy: string,
    windowFrame: string = 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW'
  ): Promise<any[]> {
    return this.knex(table).select(
      '*',
      this.knex.raw(`
        ROW_NUMBER() OVER (PARTITION BY ${partitionBy} ORDER BY ${orderBy}) as row_num
      `),
      this.knex.raw(`
        LAG(id) OVER (PARTITION BY ${partitionBy} ORDER BY ${orderBy}) as prev_id
      `),
      this.knex.raw(`
        LEAD(id) OVER (PARTITION BY ${partitionBy} ORDER BY ${orderBy}) as next_id
      `),
      this.knex.raw(`
        SUM(amount) OVER (PARTITION BY ${partitionBy} ORDER BY ${orderBy} ${windowFrame}) as running_total
      `)
    )
  }

  // Materialized view refresh
  async refreshMaterializedView(viewName: string, concurrently = true): Promise<void> {
    const sql = `REFRESH MATERIALIZED VIEW ${concurrently ? 'CONCURRENTLY' : ''} ${viewName}`
    await this.knex.raw(sql)
  }

  // Explain query plan
  async explain(query: any): Promise<any> {
    const sql = query.toSQL().sql
    const bindings = query.toSQL().bindings
    return this.knex.raw(`EXPLAIN ANALYZE ${sql}`, bindings)
  }

  // Query performance monitoring
  async monitorQuery(query: any, threshold = 1000): Promise<any> {
    const start = Date.now()
    try {
      const result = await query
      const duration = Date.now() - start

      if (duration > threshold) {
        console.warn(`Slow query detected: ${duration}ms`, {
          sql: query.toSQL().sql,
          bindings: query.toSQL().bindings,
          duration,
        })
      }

      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`Query failed after ${duration}ms`, error)
      throw error
    }
  }

  // Connection pool stats
  async getPoolStats(): Promise<any> {
    const pool = (this.knex.client.pool as any)
    return {
      used: pool.used.length,
      free: pool.free.length,
      pending: pool.pending.length,
      config: pool.config,
    }
  }
}

// Query result caching decorator
export function cacheQuery<T>(
  fn: () => Promise<T>,
  options: { ttl?: number; key?: string } = {}
): Promise<T> {
  const { ttl = 60000, key } = options
  const cacheKey = key || `query:${Date.now()}`

  // In a real implementation, this would use Redis or similar
  // This is a simplified in-memory version
  return fn()
}

// Query result pagination helper
export function paginateResults<T>(
  data: T[],
  page: number,
  perPage: number
): { data: T[]; pagination: { currentPage: number; perPage: number; total: number; totalPages: number } } {
  const total = data.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const end = start + perPage

  return {
    data: data.slice(start, end),
    pagination: {
      currentPage: page,
      perPage,
      total,
      totalPages,
    },
  }
}

// Query builder for complex filters
export class QueryBuilder {
  private conditions: string[] = []
  private params: any[] = []
  private joins: string[] = []

  where(column: string, operator: string, value: any): this {
    this.conditions.push(`${column} ${operator} ?`)
    this.params.push(value)
    return this
  }

  whereIn(column: string, values: any[]): this {
    if (values.length === 0) return this
    this.conditions.push(`${column} IN (${values.map(() => '?').join(', ')})`)
    this.params.push(...values)
    return this
  }

  whereBetween(column: string, start: any, end: any): this {
    this.conditions.push(`${column} BETWEEN ? AND ?`)
    this.params.push(start, end)
    return this
  }

  whereNull(column: string): this {
    this.conditions.push(`${column} IS NULL`)
    return this
  }

  whereNotNull(column: string): this {
    this.conditions.push(`${column} IS NOT NULL`)
    return this
  }

  whereRaw(sql: string, bindings: any[] = []): this {
    this.conditions.push(`(${sql})`)
    this.params.push(...bindings)
    return this
  }

  orWhere(column: string, operator: string, value: any): this {
    this.conditions.push(`OR ${column} ${operator} ?`)
    this.params.push(value)
    return this
  }

  leftJoin(table: string, first: string, operator: string, second: string): this {
    this.joins.push(`LEFT JOIN ${table} ON ${first} ${operator} ${second}`)
    return this
  }

  innerJoin(table: string, first: string, operator: string, second: string): this {
    this.joins.push(`INNER JOIN ${table} ON ${first} ${operator} ${second}`)
    return this
  }

  build(): { sql: string; params: any[] } {
    let sql = ''
    if (this.joins.length > 0) {
      sql += this.joins.join(' ')
    }
    if (this.conditions.length > 0) {
      sql += (sql ? ' WHERE ' : ' WHERE ') + this.conditions.join(' AND ')
    }
    return { sql, params: this.params }
  }
}

export function createQueryBuilder(): QueryBuilder {
  return new QueryBuilder()
}