import { useEffect, useRef, useState } from 'react'
import closedToiletImg from './assets/변기닫힌거.png'
import openToiletImg from './assets/변기열린거.png'
import turtleImg from './assets/늑대거북이.png'
import './App.css'

const GAME_WIDTH = 420
const GAME_HEIGHT = 620
const TOILET_WIDTH = 172
const TOILET_HEIGHT = 172
const ITEM_SIZE = 76

const toiletX = GAME_WIDTH / 2 - TOILET_WIDTH / 2
const toiletY = GAME_HEIGHT - 205

function createItem(id) {
  return {
    id,
    type: Math.random() < 0.7 ? 'good' : 'turtle',
    x: Math.random() * (GAME_WIDTH - ITEM_SIZE),
    y: 36,
    dropped: false,
  }
}

function isInsideToilet(item) {
  const centerX = item.x + ITEM_SIZE / 2
  const centerY = item.y + ITEM_SIZE / 2
  const insetX = 30
  const insetTop = 24
  const insetBottom = 38

  return (
    centerX >= toiletX + insetX &&
    centerX <= toiletX + TOILET_WIDTH - insetX &&
    centerY >= toiletY + insetTop &&
    centerY <= toiletY + TOILET_HEIGHT - insetBottom
  )
}

function App() {
  const [score, setScore] = useState(0)
  const [miss, setMiss] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [speed, setSpeed] = useState(2.2)
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

  const handleClick = () => {
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
    setSpeed(2.2)
    setGameOver(false)
    setDirection(1)
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

          if (next.x >= GAME_WIDTH - ITEM_SIZE) {
            next.x = GAME_WIDTH - ITEM_SIZE
            setDirection(-1)
          }

          setToiletOpen(false)
          return next
        }

        next.y += 7 + speed * 0.6

        const enteredToilet = next.type === 'good' && isInsideToilet(next)
        setToiletOpen(enteredToilet)

        if (next.y >= GAME_HEIGHT - ITEM_SIZE - 28) {
          const inToilet = isInsideToilet(next)
          const goodResult = next.type === 'good' && inToilet
          const turtleResult = next.type === 'turtle' && !inToilet

          if (goodResult || turtleResult) {
            setScore((prevScore) => prevScore + 1)
            setSpeed((prevSpeed) => Math.min(prevSpeed + 0.35, 10))
            setMessage(
              next.type === 'good'
                ? '휴지를 깔끔하게 넣었습니다'
                : '늑대거북이를 안전하게 지켰습니다'
            )
            setToiletOpen(next.type === 'good')
          } else {
            setMiss((prevMiss) => {
              const newMiss = prevMiss + 1

              if (newMiss >= 3) {
                setGameOver(true)
                setMessage('게임 오버')
              } else {
                setMessage(
                  next.type === 'good'
                    ? '휴지는 변기에 넣어야 합니다'
                    : '늑대거북이는 변기에 넣으면 안 됩니다'
                )
              }

              return newMiss
            })
            setToiletOpen(false)
          }

          if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
          resetTimerRef.current = setTimeout(() => {
            resetItem()
            resetTimerRef.current = null
          }, 320)
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
      <section className="game-panel">
        <header className="hud">
          <div>
            <p className="eyebrow">Arcade Mini Game</p>
            <h1>Toilet Drop</h1>
            <p className="subtitle">
              휴지는 변기에 넣고, 늑대거북이는 바깥으로 살려 보내세요.
            </p>
          </div>

          <div className="scoreboard" aria-live="polite">
            <p>
              점수 <strong>{score}</strong>
            </p>
            <p>실수 {miss}/3</p>
            <p>속도 {speed.toFixed(1)}</p>
          </div>
        </header>

        <div
          className={`game-stage ${gameOver ? 'is-over' : ''}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleClick()
            }
          }}
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          <div className="stage-glow" aria-hidden="true" />
          <div className="status-chip">
            현재 목표: {item.type === 'good' ? '휴지 넣기' : '늑대거북이 보호'}
          </div>

          <div
            className={`falling-item ${item.dropped ? 'is-dropped' : 'is-idle'} ${
              item.type === 'turtle' ? 'is-turtle' : 'is-good'
            }`}
            style={{
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              left: item.x,
              top: item.y,
            }}
          >
            {item.type === 'good' ? (
              <div className="paper-roll" aria-label="휴지">
                <span className="paper-roll-core" />
                <span className="paper-roll-sheet" />
              </div>
            ) : (
              <img src={turtleImg} alt="늑대거북이" />
            )}
          </div>

          <div
            className={`toilet-zone ${toiletOpen ? 'is-open' : ''}`}
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

          {gameOver ? (
            <div className="overlay">
              <div className="dialog">
                <p className="dialog-label">Round End</p>
                <h2>게임 오버</h2>
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

        <section className="rules">
          <p>규칙</p>
          <p>휴지는 변기에 넣으면 +1</p>
          <p>늑대거북이는 변기 밖으로 떨어뜨리면 +1</p>
          <p>휴지가 변기 안으로 들어오는 순간 변기가 열립니다.</p>
        </section>
      </section>
    </main>
  )
}

export default App
