import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Optional: allow local development to use local chrome if needed
const isLocal = process.env.NODE_ENV === 'development'

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const browser = await puppeteer.launch({
            args: isLocal ? puppeteer.defaultArgs() : chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: isLocal
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Local path for Windows
                : await chromium.executablePath(),
            headless: chromium.headless as any,
        })

        const page = await browser.newPage()

        // Set viewport and user agent to avoid bot detection
        await page.setViewport({ width: 1280, height: 800 })
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        try {
            // Navigate to URL
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

            // Scroll to trigger lazy loading if needed (common for WeChat)
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0
                    const distance = 100
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight
                        window.scrollBy(0, distance)
                        totalHeight += distance

                        if (totalHeight >= scrollHeight || totalHeight > 5000) {
                            clearInterval(timer)
                            resolve(null)
                        }
                    }, 100)
                })
            })

            // Extract content
            const analysis = await page.evaluate(() => {
                // If WeChat, use specific selector first
                const wechatContent = document.querySelector('.rich_media_content')
                const target = wechatContent || document.querySelector('article') || document.querySelector('main') || document.body

                // Clone to not affect original DOM
                const clone = target.cloneNode(true) as HTMLElement

                // Handle WeChat lazy-loaded images (they use data-src instead of src)
                const allImages = clone.querySelectorAll('img')
                allImages.forEach(img => {
                    const dataSrc = img.getAttribute('data-src')
                    if (dataSrc && !img.getAttribute('src')) {
                        img.setAttribute('src', dataSrc)
                    }
                })

                const scripts = clone.querySelectorAll('script, style, nav, footer, header, .comment')
                scripts.forEach(s => s.remove())

                const text = clone.innerText || ''
                const wordCount = text.trim().split(/\s+/).length

                const images = Array.from(clone.querySelectorAll('img')).filter(img => {
                    // Filter out tiny icons or tracking pixels
                    const width = img.naturalWidth || img.width
                    const height = img.naturalHeight || img.height

                    const attrWidth = parseInt(img.getAttribute('width') || '0')
                    const attrHeight = parseInt(img.getAttribute('height') || '0')

                    return (width > 50 || attrWidth > 50) && (height > 50 || attrHeight > 50)
                }).length

                const videos = clone.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="qq"], iframe[data-src*="qq"]').length

                return {
                    wordCount,
                    images,
                    videos,
                    title: document.title
                }
            })

            await browser.close()

            return NextResponse.json({
                success: true,
                data: analysis
            })

        } catch (error: any) {
            await browser.close()
            return NextResponse.json({ error: `Scraping failed: ${error.message}` }, { status: 500 })
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
