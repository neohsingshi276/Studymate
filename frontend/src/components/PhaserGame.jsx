import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BossScene, { WIDTH, HEIGHT } from '../game/BossScene'

export default function PhaserGame({ subject, onSceneReady }) {
    const containerRef = useRef(null)
    const gameRef = useRef(null)
    const onSceneReadyRef = useRef(onSceneReady)

    useEffect(() => {
        onSceneReadyRef.current = onSceneReady

        if (gameRef.current) {
            gameRef.current.registry.set('bossBattle', {
                subject,
                onReady: (scene) => onSceneReadyRef.current?.(scene)
            })
        }
    }, [subject, onSceneReady])

    useEffect(() => {
        if (gameRef.current) return // only ever create one game instance per mount

        const config = {
            type: Phaser.AUTO,
            width: WIDTH,
            height: HEIGHT,
            parent: containerRef.current,
            transparent: true,
            scene: [],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        }

        const game = new Phaser.Game(config)
        gameRef.current = game
        game.registry.set('bossBattle', {
            subject,
            onReady: (scene) => onSceneReadyRef.current?.(scene)
        })
        game.scene.add('BossScene', BossScene, true)

        return () => {
            onSceneReadyRef.current?.(null)
            game.destroy(true)
            gameRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            ref={containerRef}
            className="w-full max-w-[800px] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-lg"
        />
    )
}
