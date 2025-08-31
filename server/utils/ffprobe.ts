import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { writeFile, readFile, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import ffprobePath from 'ffprobe-static'

function execFileAsync(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) reject(error)
      else resolve({ stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

export interface MediaMetadata {
  width?: number
  height?: number
  durationSeconds?: number
}

export async function probeMediaBuffer(buf: Buffer): Promise<MediaMetadata> {
  const dir = join(tmpdir(), `probe-${randomUUID()}`)
  const inPath = join(dir, 'input.bin')
  await writeFile(inPath, buf)
  try {
    const args = ['-v', 'error', '-show_entries', 'stream=width,height,duration', '-of', 'json', inPath]
    const { stdout } = await execFileAsync((ffprobePath as any).path || (ffprobePath as any), args)
    const json = JSON.parse(stdout || '{}')
    const stream = (json.streams && json.streams[0]) || {}
    const width = stream.width ? Number(stream.width) : undefined
    const height = stream.height ? Number(stream.height) : undefined
    const durationSeconds = stream.duration ? Math.round(Number(stream.duration)) : undefined
    return { width, height, durationSeconds }
  } catch {
    return {}
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}


