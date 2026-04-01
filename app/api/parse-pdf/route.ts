import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Dynamic import pdf-parse to avoid bundling issues
    const pdfParse = (await import('pdf-parse')).default
    
    // Parse PDF
    const pdfData = await pdfParse(buffer)
    
    return NextResponse.json({
      text: pdfData.text,
      numPages: pdfData.numpages,
      info: pdfData.info,
    })
  } catch (error) {
    console.error('Failed to parse PDF:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to parse PDF'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
