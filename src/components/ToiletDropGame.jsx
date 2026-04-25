import { useCallback, useEffect, useRef, useState } from 'react'
import backgroundImg from '../assets/변기위에서.jpg'
import bigNaughtyImg from '../assets/변기.webp'
import closedToiletImg from '../assets/변기닫힌거.png'
import openToiletImg from '../assets/변기열린거.png'
import turtleImg from '../assets/늑대거북이.png'
import {
  DROP_HEIGHT,
  DROP_WIDTH,
  GAME_WIDTH,
  TOILET_MAX_X,
  TOILET_MIN_X,
  TOILET_HEIGHT,
  TOILET_WIDTH,
  toiletBaseX,
  toiletY,
} from '../game/constants'
import { createItem, hasReachedGround, isInsideToilet } from '../game/items'

function getNextToiletX(nextScore) {
  if (nextScore < 3) return toiletBaseX

  const range = TOILET_MAX_X - TOILET_MIN_X
  return TOILET_MIN_X + Math.random() * range
}

function ToiletDropGame() {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [speed, setSpeed] = useState(2.6)
  const [direction, setDirection] = useState(1)
  const [item, setItem] = useState(() => createItem(1))
  const [toiletOpen, setToiletOpen] = useState(false)
  const [toiletX, setToiletX] = useState(toiletBaseX)
  const rafRef = useRef(null)
  const resetTimerRef = useRef(null)
  const speedRef = useRef(speed)
  const directionRef = useRef(direction)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  const resetItem = useCallback((nextScore) => {
    setItem((prev) => createItem(prev.id + 1))
    const nextDirection = Math.random() < 0.5 ? -1 : 1
    directionRef.current = nextDirection
    setDirection(nextDirection)
    setToiletOpen(false)
    setToiletX(getNextToiletX(nextScore))
  }, [])

  const handleDrop = () => {
    if (gameOver || item.dropped || item.resolved) return
    setItem((prev) => ({ ...prev, dropped: true }))
  }

  const restart = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }

    setScore(0)
    setSpeed(2.6)
    setDirection(1)
    setGameOver(false)
    setToiletOpen(false)
    setToiletX(toiletBaseX)
    setItem(createItem(Date.now()))
  }

  useEffect(() => {
    if (gameOver) return undefined

    const tick = () => {
      setItem((prev) => {
        const next = { ...prev }

        if (next.resolved) {
          return next
        }

        if (!next.dropped) {
          next.x += directionRef.current * speedRef.current

          if (next.x <= 0) {
            next.x = 0
            directionRef.current = 1
            setDirection(1)
          }

          if (next.x >= GAME_WIDTH - DROP_WIDTH) {
            next.x = GAME_WIDTH - DROP_WIDTH
            directionRef.current = -1
            setDirection(-1)
          }

          setToiletOpen(false)
          return next
        }

        next.y += 8 + speedRef.current * 0.8

        const enteredToilet =
          next.type === 'bigNaughty' && isInsideToilet(next, toiletX, toiletY)
        setToiletOpen(enteredToilet)

        if (hasReachedGround(next)) {
          next.resolved = true
          const inToilet = isInsideToilet(next, toiletX, toiletY)
          const bigNaughtyScored = next.type === 'bigNaughty' && inToilet
          const turtleScored = next.type === 'turtle' && !inToilet

          if (bigNaughtyScored || turtleScored) {
            let nextScore = 0
            setScore((prevScore) => {
              nextScore = prevScore + 1
              return nextScore
            })
            setSpeed((prevSpeed) => {
              const nextSpeed = Math.min(prevSpeed + 0.28, 10)
              speedRef.current = nextSpeed
              return nextSpeed
            })
            setToiletOpen(next.type === 'bigNaughty')
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
            resetTimerRef.current = setTimeout(() => {
              resetItem(nextScore)
              resetTimerRef.current = null
            }, 360)
          } else {
            setToiletOpen(false)
            setGameOver(true)
          }
        }

        return next
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [gameOver, toiletX, resetItem])

  return (
    <main className="app-shell">
      <section className="game-frame">
        <div
          className={`game-stage ${gameOver ? 'is-over' : ''}`}
          onClick={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleDrop()
            }
          }}
          style={{
            backgroundImage: `linear-gradient(rgba(12, 10, 8, 0.12), rgba(12, 10, 8, 0.12)), url(${backgroundImg})`,
          }}
        >
          <div className="hud-row">
            <div className="badge">
              <span>점수</span>
              <strong>{score}</strong>
            </div>
          </div>

          <div
            className={`falling-item ${item.dropped ? 'is-dropped' : 'is-idle'} ${item.type}`}
            style={{
              width: DROP_WIDTH,
              height: DROP_HEIGHT,
              left: item.x,
              top: item.y,
            }}
          >
            <img
              src={item.type === 'bigNaughty' ? bigNaughtyImg : turtleImg}
              alt={item.type === 'bigNaughty' ? '빅나티 이미지' : '늑대거북이'}
            />
          </div>

          <div
            className={`target-toilet ${toiletOpen ? 'is-open' : ''}`}
            style={{
              width: TOILET_WIDTH,
              height: TOILET_HEIGHT,
              left: toiletX,
              top: toiletY,
            }}
          >
            <img
              src={toiletOpen ? openToiletImg : closedToiletImg}
              alt={toiletOpen ? '열린 변기' : '닫힌 변기'}
            />
          </div>

          {gameOver ? (
            <div className="overlay">
              <div className="dialog">
                <p>{score}</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    restart()
                  }}
                >
                  다시 시작
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default ToiletDropGame
