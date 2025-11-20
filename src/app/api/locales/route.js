import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const langDir = join(process.cwd(), 'public', 'lang')
    const files = await readdir(langDir)

    const jsonFiles = files.filter(file => file.endsWith('.json'))
    const locales = jsonFiles.map(file => file.replace('.json', ''))

    return Response.json({ locales })
  } catch (error) {
    console.error('Error reading lang directory:', error)
    return Response.json({ locales: ['en-US'] })
  }
}