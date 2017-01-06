import fs from 'fs'
import createjs from './create'

export function toRect (start, end) {
  let top = {}
  let bottom = {}

  if (start.x < end.x) {
    top.x = start.x
    bottom.x = end.x
  } else {
    top.x = end.x
    bottom.x = start.x
  }

  if (start.y < end.y) {
    top.y = start.y
    bottom.y = end.y
  } else {
    top.y = end.y
    bottom.y = start.y
  }

  return { x: top.x, y: top.y, w: (bottom.x - top.x), h: (bottom.y - top.y) }
}

export function save (filename, rois) {
  if (!rois.length) return
  const polys = rois.map((roi) => {
    if (roi.type === 'rectangle') {
      const { x, y } = roi.position
      const { w, h } = roi.size

      return [x, y, x + w, y, x + w, y + h, x, y + h]
    }

    if (roi.type === 'polygon') {
      return roi.coords.reduce((points, point) => {
        points.push(point.x)
        points.push(point.y)

        return points
      }, [])
    }
  })

  const content = polys.map(poly => poly.join(',')).join('\n')

  fs.writeFileSync(filename, content)
}

export function load (filename) {
  if (!fs.existsSync(filename)) {
    return []
  }

  const content = fs.readFileSync(filename).toString()
  const polys = content.split('\n').map(line => line.split(',').map(p => parseInt(p)))
  console.log(polys)

  return polys.map((points) => {
    const color = [Math.random() * 360, 70 + Math.random() * 60, 50]
    const coords = []

    while (points.length > 0) {
      const [ x, y ] = points.splice(0, 2)

      coords.push({ x, y })
    }

    return {
      type: 'polygon',
      coords,
      _meta: {
        stroke: createjs.Graphics.getHSL(...color),
        fill: createjs.Graphics.getHSL(...[...color, 0.25])
      }
    }
  })
}

export function square (x) {
  return x * x
}

export function dist (a, b) {
  return Math.sqrt(square(a.x - b.x) + square(a.y - b.y))
}
