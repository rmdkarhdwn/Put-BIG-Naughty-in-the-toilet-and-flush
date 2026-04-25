import {
  DROP_HEIGHT,
  DROP_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  TOILET_HEIGHT,
  TOILET_WIDTH,
  toiletX,
  toiletY,
} from './constants'

export function createItem(id) {
  return {
    id,
    type: Math.random() < 0.7 ? 'good' : 'turtle',
    x: Math.random() * (GAME_WIDTH - DROP_WIDTH),
    y: 34,
    dropped: false,
    resolved: false,
  }
}

export function isInsideToilet(item) {
  const centerX = item.x + DROP_WIDTH / 2
  const centerY = item.y + DROP_HEIGHT / 2
  const insetX = 16
  const insetTop = 18
  const insetBottom = 28

  return (
    centerX >= toiletX + insetX &&
    centerX <= toiletX + TOILET_WIDTH - insetX &&
    centerY >= toiletY + insetTop &&
    centerY <= toiletY + TOILET_HEIGHT - insetBottom
  )
}

export function hasReachedGround(item) {
  return item.y >= GAME_HEIGHT - DROP_HEIGHT - 18
}
