/** Snake Game. 
 * 
 * Bug: keyBoard control only one direction.
*/
import React, { useEffect, useRef, useState } from 'react'
import SnakeBlock from './SnakeBlock'
import { Button } from '@/components/ui/button'

function useSnake(steps: number = 40) {
  const snakeRef = useRef<HTMLDivElement>(null)
  const currentPosition = useRef({ x: 0, y: 0 })

  function handleMove(e: KeyboardEvent) {
    if (snakeRef.current) {
      switch (e.key) {
        case 'ArrowRight':
          currentPosition.current.x += steps
          snakeRef.current.style.transform = `translateX(${currentPosition.current.x}px)`
          break;
        case 'ArrowLeft':
          currentPosition.current.x -= steps
          snakeRef.current.style.transform = `translateX(${currentPosition.current.x}px)`
          break
        case 'ArrowUp':
          currentPosition.current.y -= steps
          snakeRef.current.style.transform = `translateY(${currentPosition.current.y}px)`
          break
        case 'ArrowDown':
          currentPosition.current.y += steps
          snakeRef.current.style.transform = `translateY(${currentPosition.current.y}px)`
          break
        default:
          break;
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleMove)

    return () => window.removeEventListener("keydown", handleMove)
  }, [])

  return { snakeRef, currentPosition }
}

const GamePage = () => {
  const { snakeRef } = useSnake()

  return (
    <div className='h-screen w-screen p-10 relative'>
      <SnakeBlock ref={snakeRef} />
      <Button variant="outline" className='absolute bottom-10 -translate-x-[50%] left-[50%]'>Show Position</Button>
    </div>
  )
}

export default GamePage
