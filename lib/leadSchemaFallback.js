// Fits a lead record to the columns the leads table really has (see app/api/cms/leads/route.js).
export function moveMissingColumnIntoPayload(record, column) {
  if (!column || !(column in record)) return record

  const next = { ...record }
  if (column === 'payload') {
    delete next.payload
    return next
  }

  // Older leads tables keep the name in "name" (see 202610100001_leads_add_missing_columns.sql);
  // store it there rather than losing it.
  if (column === 'full_name' && !('name' in next)) {
    next.name = next.full_name
    delete next.full_name
    return next
  }

  const payload = next.payload && typeof next.payload === 'object' ? { ...next.payload } : {}

  if (next[column] !== null && next[column] !== undefined && payload[column] === undefined) {
    payload[column] = next[column]
  }

  delete next[column]
  next.payload = payload
  return next
}
