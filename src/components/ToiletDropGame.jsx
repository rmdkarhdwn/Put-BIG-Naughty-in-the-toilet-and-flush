import { useEffect, useRef, useState } from 'react'
import backgroundImg from '../assets/변기위에서.jpg'
import goodItemImg from '../assets/변기.webp'
import closedToiletImg from '../assets/변기닫힌거.png'
import openToiletImg from '../assets/변기열린거.png'
import turtleImg from '../assets/늑대거북이.png'
import {
  DROP_HEIGHT,
  DROP_WIDTH,
  GAME_WIDTH,
  TOILET_HEIGHT,
  TOILET_WIDTH,
  toiletX,
  toiletY,
} from '../game/constants'
import { createItem, hasReachedGround, isInsideToilet } from '../game/items'

function ToiletDropGame() {
  const [score, setScore] = useState(0)
  const [miss, setMiss] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [speed, setSpeed] = useState(2.6)
  const [direction, setDirection] = useState(1)
  const [item, setItem] = useState(() => createItem(1))
  const [message, setMessage] = useState('클릭해서 떨어뜨리세요')
  const [toiletOpen, setToiletOpen] = useState(false)
  const rafRef = useRef(null)
  const resetTimerRef = useRef(null)

  const resetItem = () => {
    setItem((prev) => createItem(prev.id + 1))
    setDirection(Math.random() < 0.5 ? -1 : 1)
    setToiletOpen(false)
  }

  const handleDrop = () => {
    if (gameOver || item.dropped) return
    setItem((prev) => ({ ...prev, dropped: true }))
  }

  const restart = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }

    setScore(0)
    setMiss(0)
    setSpeed(2.6)
    setDirection(1)
    setGameOver(false)
    setMessage('클릭해서 떨어뜨리세요')
    setToiletOpen(false)
    setItem(createItem(Date.now()))
  }

  useEffect(() => {
    if (gameOver) return undefined

    const tick = () => {
      setItem((prev) => {
        const next = { ...prev }

        if (!next.dropped) {
          next.x += direction * speed

          if (next.x <= 0) {
            next.x = 0
            setDirection(1)
          }

          if (next.x >= GAME_WIDTH - DROP_WIDTH) {
            next.x = GAME_WIDTH - DROP_WIDTH
            setDirection(-1)
          }

          setToiletOpen(false)
          return next
        }

        next.y += 8 + speed * 0.8

        const enteredToilet = next.type === 'good' && isInsideToilet(next)
        setToiletOpen(enteredToilet)

        if (hasReachedGround(next)) {
          const inToilet = isInsideToilet(next)
          const goodResult = next.type === 'good' && inToilet
          const turtleResult = next.type === 'turtle' && !inToilet

          if (goodResult || turtleResult) {
            setScore((prevScore) => prevScore + 1)
            setSpeed((prevSpeed) => Math.min(prevSpeed + 0.28, 10))
            setMessage(
              next.type === 'good'
                ? '변기를 정확히 집어넣었습니다'
                : '늑대거북이를 무사히 살렸습니다'
            )
            setToiletOpen(next.type === 'good')
          } else {
            setMiss((prevMiss) => {
              const nextMiss = prevMiss + 1

              if (nextMiss >= 3) {
                setGameOver(true)
                setMessage('게임 오버')
              } else {
                setMessage(
                  next.type === 'good'
                    ? '변기 이미지는 아래 변기 안으로 넣어야 합니다'
                    : '늑대거북이는 변기 밖으로 보내야 합니다'
                )
              }

              return nextMiss
            })
            setToiletOpen(false)
          }

          if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
          resetTimerRef.current = setTimeout(() => {
            resetItem()
            resetTimerRef.current = null
          }, 360)
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
  }, [direction, gameOver, speed])

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
            <div className="badge">실수 {miss}/3</div>
          </div>

          <div className="status-banner">현재 목표: {item.type === 'good' ? '변기 투하' : '늑대거북이 보호'}</div>

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
              src={item.type === 'good' ? goodItemImg : turtleImg}
              alt={item.type === 'good' ? '변기 이미지' : '늑대거북이'}
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

          <div className="message-bar">{message}</div>

          <div className="rules-panel">
            <p>배경은 `변기위에서.jpg`</p>
            <p>투하용 이미지는 `변기.webp`</p>
            <p>휴지는 아래 변기 안으로, 늑대거북이는 바깥으로</p>
          </div>

          {gameOver ? (
            <div className="overlay">
              <div className="dialog">
                <p className="dialog-label">Round End</p>
                <h1>게임 오버</h1>
                <p>최종 점수: {score}</p>
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
