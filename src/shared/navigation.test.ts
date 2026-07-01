import { describe, expect, it } from 'vitest'
import {
  buildSearchUrl,
  extractRealUrl,
  isLikelyUrlInput,
  isSearchEngineUrl,
  normalizeUrlInput,
} from './navigation'

describe('isLikelyUrlInput', () => {
  it.each([
    ['example.com'],
    ['docs.example.co/path'],
    ['https://example.com'],
    ['HTTP://EXAMPLE.COM'],
  ])('detects URL input: %s', (input) => {
    expect(isLikelyUrlInput(input)).toBe(true)
  })

  it.each(['', '   ', 'slide web', 'docs'])('detects search input: %s', (input) => {
    expect(isLikelyUrlInput(input)).toBe(false)
  })
})

describe('normalizeUrlInput', () => {
  it('trims input and adds https to bare domains', () => {
    expect(normalizeUrlInput('  example.com/docs  ')).toBe('https://example.com/docs')
  })

  it('preserves explicit http and https schemes', () => {
    expect(normalizeUrlInput('http://example.com')).toBe('http://example.com')
    expect(normalizeUrlInput('https://example.com')).toBe('https://example.com')
  })

  it.each(['', '   ', 'hello world'])('rejects invalid URL input: %s', (input) => {
    expect(() => normalizeUrlInput(input)).toThrow()
  })
})

describe('buildSearchUrl', () => {
  it('builds an encoded Google search URL', () => {
    expect(buildSearchUrl('google', 'slide web')).toBe('https://www.google.com/search?q=slide%20web')
  })

  it('builds an encoded Baidu search URL', () => {
    expect(buildSearchUrl('baidu', '中文 query')).toBe(
      'https://www.baidu.com/s?wd=%E4%B8%AD%E6%96%87%20query',
    )
  })
})

describe('isSearchEngineUrl', () => {
  it.each([
    ['https://www.google.com/search?q=slide'],
    ['https://www.google.com.hk/search?q=slide'],
    ['https://www.google.co.jp/search?q=slide'],
    ['https://www.google.com/maps?q=slide'],
    ['https://www.google.com.hk/preferences'],
    ['https://www.google.com.hk/sorry/index?continue=https%3A%2F%2Fwww.google.com.hk%2Fsearch%3Fq%3Dslide'],
    ['https://www.google.com/recaptcha/api2/anchor?k=site-key'],
    ['https://www.gstatic.com/recaptcha/releases/demo/recaptcha__zh_cn.js'],
    ['https://www.recaptcha.net/recaptcha/api2/bframe?k=site-key'],
    ['https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fdoc&sa=U'],
    ['https://accounts.google.com/signin'],
    ['https://www.baidu.com/s?wd=slide'],
    ['https://www.baidu.com/link?url=abc123'],
    ['https://wappass.baidu.com/static/captcha/tuxing.html'],
  ])('allows search-engine navigation: %s', (url) => {
    expect(isSearchEngineUrl(url)).toBe(true)
  })

  it.each(['https://example.com', 'not a url'])('blocks non-search navigation: %s', (url) => {
    expect(isSearchEngineUrl(url)).toBe(false)
  })
})

describe('extractRealUrl', () => {
  it('extracts Google result redirect URLs', () => {
    const url = 'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fdoc&sa=U'
    expect(extractRealUrl(url)).toBe('https://example.com/doc')
  })

  it('extracts Google country-domain redirect URLs', () => {
    const url = 'https://www.google.com.hk/url?url=https%3A%2F%2Fexample.org%2Fpaper&sa=U'
    expect(extractRealUrl(url)).toBe('https://example.org/paper')
  })

  it('extracts ad redirect URLs', () => {
    const url = 'https://googleadservices.com/pagead/aclk?adurl=https%3A%2F%2Fexample.com%2Fbuy'
    expect(extractRealUrl(url)).toBe('https://example.com/buy')
  })

  it('leaves unresolved or invalid URLs unchanged', () => {
    expect(extractRealUrl('https://www.baidu.com/link?url=abc123')).toBe(
      'https://www.baidu.com/link?url=abc123',
    )
    expect(extractRealUrl('not a url')).toBe('not a url')
  })
})
