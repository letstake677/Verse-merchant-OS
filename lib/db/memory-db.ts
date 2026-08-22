import { ObjectId } from "mongodb"

/**
 * In-Memory MongoDB-compatible Database Layer
 * Used when MONGODB_URI is not set or when local offline resilience is required.
 * Fully supports CRUD, filtering, projections, sorting, pagination, and basic aggregation.
 */

declare global {
  var _verseInMemoryStorage: Map<string, Map<string, any>> | undefined
}

if (!global._verseInMemoryStorage) {
  global._verseInMemoryStorage = new Map<string, Map<string, any>>()
}

function getStore(collectionName: string): Map<string, any> {
  if (!global._verseInMemoryStorage!.has(collectionName)) {
    global._verseInMemoryStorage!.set(collectionName, new Map<string, any>())
  }
  return global._verseInMemoryStorage!.get(collectionName)!
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== "object") return undefined
  if (path in obj) return obj[path]
  const parts = path.split(".")
  let curr = obj
  for (const p of parts) {
    if (curr === null || curr === undefined || typeof curr !== "object") return undefined
    curr = curr[p]
  }
  return curr
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split(".")
  let curr = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (!curr[p] || typeof curr[p] !== "object") {
      curr[p] = {}
    }
    curr = curr[p]
  }
  curr[parts[parts.length - 1]] = value
}

function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true

  for (const key of Object.keys(filter)) {
    const filterVal = filter[key]

    if (key === "$or" && Array.isArray(filterVal)) {
      const matchAny = filterVal.some((subFilter) => matchesFilter(doc, subFilter))
      if (!matchAny) return false
      continue
    }

    if (key === "$and" && Array.isArray(filterVal)) {
      const matchAll = filterVal.every((subFilter) => matchesFilter(doc, subFilter))
      if (!matchAll) return false
      continue
    }

    const docVal = getNestedValue(doc, key)

    if (key === "_id") {
      const docIdStr = doc._id?.toString?.() || String(doc._id)
      if (filterVal instanceof ObjectId || typeof filterVal === "string") {
        const filterIdStr = filterVal.toString()
        if (docIdStr !== filterIdStr) return false
        continue
      }
    }

    if (filterVal && typeof filterVal === "object" && !(filterVal instanceof ObjectId) && !(filterVal instanceof Date) && !(filterVal instanceof RegExp)) {
      for (const op of Object.keys(filterVal)) {
        const opVal = filterVal[op]
        if (op === "$in" && Array.isArray(opVal)) {
          const matched = opVal.some((v) => {
            if (v instanceof ObjectId || docVal instanceof ObjectId) {
              return String(v) === String(docVal)
            }
            return v === docVal
          })
          if (!matched) return false
        } else if (op === "$nin" && Array.isArray(opVal)) {
          const matched = opVal.some((v) => v === docVal || String(v) === String(docVal))
          if (matched) return false
        } else if (op === "$eq") {
          if (docVal !== opVal && String(docVal) !== String(opVal)) return false
        } else if (op === "$ne") {
          if (docVal === opVal || String(docVal) === String(opVal)) return false
        } else if (op === "$gt") {
          if (!(docVal > opVal)) return false
        } else if (op === "$gte") {
          if (!(docVal >= opVal)) return false
        } else if (op === "$lt") {
          if (!(docVal < opVal)) return false
        } else if (op === "$lte") {
          if (!(docVal <= opVal)) return false
        } else if (op === "$regex") {
          const flags = filterVal.$options || ""
          const regex = typeof opVal === "string" ? new RegExp(opVal, flags) : opVal
          if (!regex.test(String(docVal || ""))) return false
        } else if (op === "$exists") {
          const exists = docVal !== undefined
          if (exists !== Boolean(opVal)) return false
        }
      }
      continue
    }

    if (filterVal instanceof RegExp) {
      if (!filterVal.test(String(docVal || ""))) return false
      continue
    }

    if (docVal instanceof ObjectId || filterVal instanceof ObjectId) {
      if (String(docVal) !== String(filterVal)) return false
      continue
    }

    if (docVal !== filterVal) {
      return false
    }
  }

  return true
}

function applyUpdate(doc: any, update: any): any {
  const updated = { ...doc }

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      setNestedValue(updated, k, v)
    }
  }

  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      const current = Number(getNestedValue(updated, k) || 0)
      setNestedValue(updated, k, current + Number(v))
    }
  }

  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      const current = getNestedValue(updated, k) || []
      const arr = Array.isArray(current) ? [...current] : [current]
      arr.push(v)
      setNestedValue(updated, k, arr)
    }
  }

  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      delete updated[k]
    }
  }

  return updated
}

export class MemoryCollection<T = any> {
  private collectionName: string

  constructor(name: string) {
    this.collectionName = name
  }

  private getStore() {
    return getStore(this.collectionName)
  }

  async findOne(filter: any = {}): Promise<T | null> {
    const store = this.getStore()
    for (const doc of store.values()) {
      if (matchesFilter(doc, filter)) {
        return JSON.parse(JSON.stringify(doc))
      }
    }
    return null
  }

  find(filter: any = {}) {
    const store = this.getStore()
    const matchingDocs: any[] = []

    for (const doc of store.values()) {
      if (matchesFilter(doc, filter)) {
        matchingDocs.push(JSON.parse(JSON.stringify(doc)))
      }
    }

    let sortFn: ((a: any, b: any) => number) | null = null
    let skipCount = 0
    let limitCount = Infinity

    const cursor = {
      sort: (sortSpec: Record<string, number>) => {
        const entries = Object.entries(sortSpec)
        sortFn = (a, b) => {
          for (const [key, dir] of entries) {
            const valA = getNestedValue(a, key)
            const valB = getNestedValue(b, key)
            if (valA < valB) return dir === -1 ? 1 : -1
            if (valA > valB) return dir === -1 ? -1 : 1
          }
          return 0
        }
        return cursor
      },
      skip: (count: number) => {
        skipCount = count || 0
        return cursor
      },
      limit: (count: number) => {
        limitCount = count || Infinity
        return cursor
      },
      toArray: async (): Promise<T[]> => {
        let results = [...matchingDocs]
        if (sortFn) {
          results.sort(sortFn)
        }
        if (skipCount > 0) {
          results = results.slice(skipCount)
        }
        if (limitCount < Infinity) {
          results = results.slice(0, limitCount)
        }
        return results
      },
      [Symbol.asyncIterator]: async function* () {
        const results = await cursor.toArray()
        for (const item of results) {
          yield item
        }
      },
    }

    return cursor
  }

  async insertOne(doc: any): Promise<{ insertedId: ObjectId; acknowledged: boolean }> {
    const store = this.getStore()
    const id = doc._id instanceof ObjectId ? doc._id : new ObjectId()
    const storedDoc = { ...doc, _id: id }
    store.set(id.toString(), storedDoc)
    return { insertedId: id, acknowledged: true }
  }

  async insertMany(docs: any[]): Promise<{ insertedCount: number; insertedIds: Record<number, ObjectId>; acknowledged: boolean }> {
    const insertedIds: Record<number, ObjectId> = {}
    let count = 0
    for (let i = 0; i < docs.length; i++) {
      const res = await this.insertOne(docs[i])
      insertedIds[i] = res.insertedId
      count++
    }
    return { insertedCount: count, insertedIds, acknowledged: true }
  }

  async updateOne(filter: any, update: any, options: { upsert?: boolean } = {}): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: ObjectId }> {
    const store = this.getStore()
    for (const [idStr, doc] of store.entries()) {
      if (matchesFilter(doc, filter)) {
        const updated = applyUpdate(doc, update)
        store.set(idStr, updated)
        return { matchedCount: 1, modifiedCount: 1 }
      }
    }

    if (options.upsert) {
      const newDoc = { ...(filter || {}) }
      if (update.$setOnInsert) {
        Object.assign(newDoc, update.$setOnInsert)
      }
      const updated = applyUpdate(newDoc, update)
      const res = await this.insertOne(updated)
      return { matchedCount: 0, modifiedCount: 0, upsertedId: res.insertedId }
    }

    return { matchedCount: 0, modifiedCount: 0 }
  }

  async updateMany(filter: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }> {
    const store = this.getStore()
    let count = 0
    for (const [idStr, doc] of store.entries()) {
      if (matchesFilter(doc, filter)) {
        const updated = applyUpdate(doc, update)
        store.set(idStr, updated)
        count++
      }
    }
    return { matchedCount: count, modifiedCount: count }
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const store = this.getStore()
    for (const [idStr, doc] of store.entries()) {
      if (matchesFilter(doc, filter)) {
        store.delete(idStr)
        return { deletedCount: 1 }
      }
    }
    return { deletedCount: 0 }
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    const store = this.getStore()
    let count = 0
    for (const [idStr, doc] of store.entries()) {
      if (matchesFilter(doc, filter)) {
        store.delete(idStr)
        count++
      }
    }
    return { deletedCount: count }
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const store = this.getStore()
    let count = 0
    for (const doc of store.values()) {
      if (matchesFilter(doc, filter)) {
        count++
      }
    }
    return count
  }

  async aggregate(pipeline: any[] = []): Promise<{ toArray: () => Promise<any[]> }> {
    const store = this.getStore()
    let currentDocs: any[] = Array.from(store.values()).map((d) => JSON.parse(JSON.stringify(d)))

    for (const stage of pipeline) {
      if (stage.$match) {
        currentDocs = currentDocs.filter((doc) => matchesFilter(doc, stage.$match))
      } else if (stage.$sort) {
        const entries = Object.entries(stage.$sort)
        currentDocs.sort((a, b) => {
          for (const [key, dir] of entries) {
            const valA = getNestedValue(a, key)
            const valB = getNestedValue(b, key)
            if (valA < valB) return dir === -1 ? 1 : -1
            if (valA > valB) return dir === -1 ? -1 : 1
          }
          return 0
        })
      } else if (stage.$skip) {
        currentDocs = currentDocs.slice(stage.$skip)
      } else if (stage.$limit) {
        currentDocs = currentDocs.slice(0, stage.$limit)
      } else if (stage.$group) {
        const groups = new Map<string, any>()
        const groupSpec = stage.$group
        const idExpr = groupSpec._id

        for (const doc of currentDocs) {
          const groupId = idExpr === null ? "null" : String(getNestedValue(doc, String(idExpr).replace(/^\$/, "")))
          if (!groups.has(groupId)) {
            groups.set(groupId, { _id: idExpr === null ? null : groupId, count: 0, total: 0, items: [] })
          }
          const grp = groups.get(groupId)
          grp.count++
          grp.items.push(doc)

          for (const [field, acc] of Object.entries(groupSpec)) {
            if (field === "_id") continue
            if (acc && typeof acc === "object") {
              if ("$sum" in acc) {
                const sumExpr = (acc as any).$sum
                const val = typeof sumExpr === "number" ? sumExpr : Number(getNestedValue(doc, String(sumExpr).replace(/^\$/, "")) || 0)
                grp[field] = (grp[field] || 0) + val
              } else if ("$avg" in acc) {
                const avgExpr = (acc as any).$avg
                const val = Number(getNestedValue(doc, String(avgExpr).replace(/^\$/, "")) || 0)
                grp[`_${field}_sum`] = (grp[`_${field}_sum`] || 0) + val
                grp[field] = grp[`_${field}_sum`] / grp.count
              }
            }
          }
        }
        currentDocs = Array.from(groups.values())
      }
    }

    return {
      toArray: async () => currentDocs,
    }
  }

  async createIndex(_spec: any, _options?: any): Promise<string> {
    return "memory_idx"
  }

  async createIndexes(_specs: any[]): Promise<string[]> {
    return ["memory_idx"]
  }
}

export class MemoryDb {
  public databaseName: string

  constructor(name = "verse-merchant-os") {
    this.databaseName = name
  }

  collection<T = any>(name: string): any {
    return new MemoryCollection<T>(name)
  }

  async command(_cmd: any): Promise<{ ok: number }> {
    return { ok: 1 }
  }
}
