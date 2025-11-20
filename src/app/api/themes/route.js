import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const themesDir = join(process.cwd(), 'public', 'themes')
    const files = await readdir(themesDir)

    const jsonFiles = files.filter(file => file.endsWith('.json'))

    const themes = jsonFiles.map(file => file.replace('.json', ''))

    return Response.json({ themes })
  } catch (error) {
    console.error('Error reading themes directory:', error)
    return Response.json({ themes: ['default', 'dark'] })
  }
}