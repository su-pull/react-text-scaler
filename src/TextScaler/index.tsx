import React, { useState, useRef, useCallback, useEffect } from 'react'
import styles from './styles.module.css'

type TextScalerProps = {
  scaleRange: number
  stickSize: number
  className?: string
}

// Main functional,
// this project of size variable is all font size value.
export const TextScaler = ({
  scaleRange,
  stickSize,
  className
}: TextScalerProps) => {
  const size = scaleRange
  const refParent = useRef<HTMLDivElement>(null)
  const refSwipe = useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = useState<number[]>([])
  const [initialSize, setInitialSize] = useState(0)
  const [initialColor, setInitialColor] = useState('')
  const [initialX, setInitialX] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [entryCount, setEntryCount] = useState(0)
  const [applyCount, setApplyCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoving, setHasMoving] = useState(false)

  // this is a calucration a variables.
  const offset = initialSize - 10
  const offsetFactor = 1 / initialSize
  const scaleFactor = 100 / size
  const fontSizeRatio = (1 / scaleFactor) * offsetFactor
  const maxCountSize = size + initialSize
  const minValue = -offset
  const maxValue = size >= 14 ? size - offset : size
  const exception = `:not(.${styles.parent} *)`

  // The Core functional.
  const handleSetCount = useCallback(
    (delta: number) => {
      setEntryCount(prevCount => {
        // this is handle the delta of handle as threshold, one step is 1px with fontSizeRatio.
        const clampedValue = Math.max(
          prevCount + delta * fontSizeRatio,
          -initialSize / 5
        )

        // count is passed to the useLayoutEffect as variable in scale.
        return Math.min(Math.max(clampedValue, minValue), maxValue)
      })
    },
    [fontSizeRatio, initialSize, maxValue, minValue]
  )

  useEffect(() => {
    const elements = document.querySelectorAll('main' + ' *' + exception)
    const fontSizeArray = []

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const computedStyle = getComputedStyle(element)
      const fontSize = parseFloat(computedStyle.fontSize)
      fontSizeArray.push(isNaN(fontSize) ? 14 : fontSize)
    }

    setSizes(fontSizeArray)
  }, [exception])

  // The scaling the sizes values individually set a value.
  useEffect(() => {
    const scale = 1 + entryCount / 10 // use the entryCount variable.
    const elements = document.querySelectorAll('main' + ' *' + exception)

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement
      const initialFontSize = sizes[i]
      let scaleFontSize = initialFontSize * scale

      if (scaleFontSize <= 10) scaleFontSize = 10

      scaleFontSize = Math.min(scaleFontSize, maxCountSize)
      element.style.setProperty('font-size', Math.round(scaleFontSize) + 'px')
      console.log(Math.floor(scaleFontSize))
    }

    const body = document.querySelector('body') as HTMLElement
    const computedStyleBody = getComputedStyle(body)
    const bodySize = parseFloat(computedStyleBody.fontSize)
    const bodyTextColor = window
      .getComputedStyle(body)
      .getPropertyValue('color')
    setInitialSize(bodySize) // mount the initialSize as factors calucration.
    setInitialColor(bodyTextColor) // initial body text color.
    return setApplyCount(Math.round(Math.min(bodySize * scale, maxCountSize)))
  }, [exception, entryCount, maxCountSize, sizes])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    setVisible(true)
    setHasMoving(false)
    setTouchStartX(touch.clientX)
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (applyCount <= maxCountSize) {
        const touch = e.touches[0]
        const delta = touch.clientX - touchStartX
        handleSetCount(delta * 8)
        setTouchStartX(touch.clientX)
        setHasMoving(true)
      }
    },
    [applyCount, handleSetCount, maxCountSize, touchStartX]
  )

  const handleReset = useCallback(() => {
    setVisible(false)
    !hasMoving && setEntryCount(0)
  }, [hasMoving])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true)
    setVisible(true)
    setHasMoving(false)
    setInitialX(e.clientX)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && applyCount <= maxCountSize) {
        const delta = e.clientX - initialX
        handleSetCount(delta * 8)
        setInitialX(e.clientX)
        setHasMoving(true)
      }
    },
    [applyCount, handleSetCount, initialX, isDragging, maxCountSize]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setVisible(false)
  }, [])

  // The entry of core handlers.
  useEffect(() => {
    const control = refParent.current as HTMLDivElement
    const box = refSwipe.current as HTMLDivElement

    control.addEventListener('touchstart', handleTouchStart)
    box.addEventListener('touchmove', handleTouchMove)
    control.addEventListener('touchend', handleReset)

    control.addEventListener('mouseup', handleReset)
    control.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      // mobile handle.
      control.removeEventListener('touchstart', handleTouchStart)
      box.removeEventListener('touchmove', handleTouchMove)
      control.removeEventListener('touchend', handleReset)

      // desktop handle.
      control.removeEventListener('mouseup', handleReset)
      control.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleReset,
    handleTouchMove,
    handleTouchStart
  ])

  // The control start or end.
  useEffect(() => {
    document.body.style.cursor = isDragging ? 'grabbing' : 'auto'

    const enterControl = (e: Event) => {
      e.preventDefault()
    }

    const control = refParent.current as HTMLDivElement
    control.addEventListener('touchmove', enterControl, { passive: false })

    return () => {
      control.removeEventListener('touchmove', enterControl)
    }
  }, [isDragging])

  const [visible, setVisible] = useState(false)

  // entry classes group.
  const classesPparent = className + ' ' + styles.parent
  const classesView =
    styles.center + ' ' + (visible ? styles.visible : styles.hidden)

  // The return the next React component.
  return (
    <div
      draggable="false"
      ref={refParent}
      className={classesPparent}
      style={{ border: visible ? 'none' : '' }}
    >
      {!visible && <div className={styles.box}>T</div>}
      {visible && (
        <div className={styles.counter}>
          {applyCount}
          <span className={styles.px}>px</span>
        </div>
      )}
      <div ref={refSwipe} className={classesView}>
        <span
          className={styles.sizeSmallT}
          style={{ marginRight: visible ? 8 : 0 }}
        >
          T
        </span>
        <div
          className={styles.stick}
          style={{ background: visible ? initialColor : '', width: stickSize }}
        />
        <span
          className={styles.sizeBigT}
          style={{ marginLeft: visible ? 8 : 0 }}
        >
          T
        </span>
      </div>
    </div>
  )
}
