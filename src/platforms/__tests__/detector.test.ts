import { PlatformDetector } from '../detection/detector'
import { Platform } from '../config'

describe('PlatformDetector', () => {
  let detector: PlatformDetector
  
  beforeEach(() => {
    detector = PlatformDetector.getInstance()
    detector.reset()
  })
  
  it('should detect web platform by default', () => {
    expect(detector.detect()).toBe(Platform.WEB)
  })
  
  it('should detect Base App when MiniKit is present', () => {
    // Mock MiniKit presence
    (window as any).MiniKit = {}
    expect(detector.detect()).toBe(Platform.BASE_APP)
    delete (window as any).MiniKit
  })
  
  it('should detect Base App when webkit minikit is present', () => {
    // Mock webkit minikit
    (window as any).webkit = {
      messageHandlers: {
        minikit: {}
      }
    }
    expect(detector.detect()).toBe(Platform.BASE_APP)
    delete (window as any).webkit
  })
  
  it('should detect Telegram WebApp when present', () => {
    (window as any).Telegram = {
      WebApp: {}
    }
    expect(detector.detect()).toBe(Platform.TELEGRAM)
    delete (window as any).Telegram
  })
  
  it('should cache detection result', () => {
    const firstResult = detector.detect()
    const secondResult = detector.detect()
    expect(firstResult).toBe(secondResult)
  })
  
  it('should reset detection cache', () => {
    detector.detect()
    detector.reset()
    // Should detect again after reset
    const result = detector.detect()
    expect(result).toBe(Platform.WEB)
  })
  
  it('should provide platform info', () => {
    const info = detector.getPlatformInfo()
    expect(info).toHaveProperty('platform')
    expect(info).toHaveProperty('userAgent')
    expect(info).toHaveProperty('screen')
    expect(info).toHaveProperty('features')
  })
  
  it('should detect various browser features', () => {
    const info = detector.getPlatformInfo()
    expect(Array.isArray(info.features)).toBe(true)
  })
})