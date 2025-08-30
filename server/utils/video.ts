import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { writeFile, readFile, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import ffmpegPath from 'ffmpeg-static'

function execFileAsync(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export async function generatePosterFromVideoBuffer(video: Buffer, opts?: { atSeconds?: number; width?: number }): Promise<Buffer> {
  const at = opts?.atSeconds ?? 1
  const width = opts?.width ?? 640
  const dir = join(tmpdir(), `poster-${randomUUID()}`)
  const inPath = join(dir, 'input.bin')
  const outPath = join(dir, 'poster.jpg')
  await writeFile(inPath, video)
  try {
    const args = [
      '-y',
      '-ss', String(at),
      '-i', inPath,
      '-frames:v', '1',
      '-q:v', '2',
      '-vf', `scale=${width}:-2`,
      outPath
    ]
    await execFileAsync(ffmpegPath as string, args)
    const poster = await readFile(outPath)
    return poster
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}


