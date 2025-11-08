"use client"

import * as PIXI from 'pixi.js';
import {useCallback, useEffect, useRef, useState} from "react";
import RabbitModal from "@/app/components/modal/rabbitModal";
import {useRouter} from "next/navigation";
import {submitCheckAction} from "@/app/habits/[habitId]/actions";

type MainProps = {
    habit: {
        habitId: bigint;
        title: string | null;
        rabbitName: string | null;
        rabbitStatus: string;
        combo: bigint | null;
        isAttendance: boolean | null;
        channelId: number | null;
    }
}

const { Application, Graphics, Assets, Rectangle, Texture, AnimatedSprite, TextureSource } = PIXI;

const PIXEL_SCALE = 2;

const BUNNY_SHEET = '/assets/bunny-Sheet.png';
const BUNNY_FRAME_WIDTH = 55;
const BUNNY_FRAME_HEIGHT = 74;
const BUNNY_TOTAL_FRAMES = 23;
const BUNNY_ANIMATION_SPEED = 0.05;

const IDLE_START1 = 0;
const IDLE_END1 = 2;
const IDLE_START2 = 17;
const IDLE_END2 = 23;
const WALK_START = 8;
const WALK_END = 13;
const HUNGRY_START = 2;
const HUNGRY_END = 8;

const NAME_TEXT_STYLE = new PIXI.TextStyle({
    fontSize: 9 * PIXEL_SCALE,
    fill: '#484541',
    fontWeight: 'bold',
});

const drawSky = (app: PIXI.Application) => {
    return new Graphics()
        .rect(0, 0, app.screen.width, app.screen.height / 3)
        .fill('#c6e7f0')
}

const createCloud = (x: number, y: number, scale: number) => {
    return new Graphics()
        .rect(x, y + 10 * scale, 30 * scale, 10 * scale)
        .rect(x + 10 * scale, y, 40 * scale, 20 * scale)
        .rect(x + 40 * scale, y + 10 * scale, 30 * scale, 10 * scale)
        .fill('#FFFFFF')
}

const drawGrassField = (app: PIXI.Application) => {
    return new Graphics()
        .rect(0, app.screen.height / 3, app.screen.width, app.screen.height / 3 * 2)
        .fill('#97dd99')
}

const drawPixelFence = (app: PIXI.Application, scale: number) => {
    const fence = new Graphics()

    const fenceColor = '#b77d57'
    const fenceY = app.screen.height / 3 - (10 * scale)

    const postWidth = 10 * scale
    const postHeight = 40 * scale
    const railHeight = 10 * scale
    const postSpacing = 40 * scale

    const topRail = new Graphics().rect(0, fenceY, app.screen.width, railHeight).fill(fenceColor)
    const bottomRail = new Graphics().rect(0, fenceY + postHeight / 2, app.screen.width, railHeight).fill(fenceColor)

    fence.addChild(topRail, bottomRail)

    for (let i = 0; i < app.screen.width / postSpacing; i++) {
        const xPos = i * postSpacing + (postSpacing / 2) - (postWidth / 2)
        const post = new Graphics().rect(xPos, fenceY, postWidth, postHeight).fill(fenceColor)
        fence.addChild(post)
    }
    return fence
}

const drawSignpost = (app: PIXI.Application, rabbitName: string | null, scale: number) => {
    const nameText = new PIXI.Text({
        text: rabbitName || '토끼',
        style: NAME_TEXT_STYLE,
    })
    nameText.anchor.set(0.5, 0.5)

    const fixedX = app.screen.width / 6
    const grassTopY = app.screen.height / 2
    const signHeight = 65 * scale
    const postWidth = 6 * scale
    const padding = 8 * scale

    const boardWidth = nameText.width + 3 * padding
    const boardHeight = nameText.height + 2 * padding
    const boardTopY = grassTopY - boardHeight + 4 * padding

    const signpostGraphics = new PIXI.Graphics()

    signpostGraphics.rect(
        fixedX - (postWidth / 2),
        grassTopY,
        postWidth,
        signHeight
    ).fill(0x64422f)

    signpostGraphics.rect(
        fixedX - (boardWidth / 2),
        boardTopY,
        boardWidth,
        boardHeight,
    ).fill(0xf1dbd9)

    nameText.x = fixedX
    nameText.y = boardTopY + (boardHeight / 2)

    return { Graphics: signpostGraphics, Text: nameText }
};

function MainComponent({ habit }: MainProps) {
    const router = useRouter()

    const canvasRef = useRef<HTMLDivElement | null>(null)
    const appRef = useRef<PIXI.Application | null>(null)
    const handleResizeRef = useRef<(() => void) | null>(null)

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = () => {
        setIsModalOpen(false)
    }

    useEffect(() => {
        let skyGraphics: PIXI.Graphics | null = null
        let cloud1Graphics: PIXI.Graphics | null = null
        let cloud2Graphics: PIXI.Graphics | null = null
        let grassFieldGraphics: PIXI.Graphics | null = null
        let fenceGraphics: PIXI.Graphics | null = null
        let signpostGraphics: PIXI.Graphics | null = null
        let rabbitNameText: PIXI.Text | null = null

        let escapedHoleGraphics: PIXI.Graphics | null = null
        let bunnySprite: PIXI.AnimatedSprite | null = null
        let bunnyDirection = 1
        const bunnySpeed = PIXEL_SCALE

        let targetX: number | null = null
        let targetY: number | null = null

        let isMoving = false
        let idleTimer = 0
        const idleDelayMS = 2000

        const isHungry = habit.rabbitStatus === 'hungry'
        const isEscaped = habit.rabbitStatus === 'escaped'

        const initializePixi = async () => {
            if (!canvasRef.current || appRef.current) return

            TextureSource.defaultOptions.resolution = 1

            try {
                const app = new Application()

                await app.init({
                    resizeTo: canvasRef.current,
                    background: 0xFFFFFF,
                    resolution: 1,
                    autoDensity: true,
                })

                Object.assign(app.canvas.style, {
                    width: '100%',
                    height: '100%',
                    display: 'block',
                })

                canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
                appRef.current = app

                skyGraphics = drawSky(app)

                cloud1Graphics = createCloud(app.screen.width * 0.1, 20 * PIXEL_SCALE, PIXEL_SCALE);
                cloud2Graphics = createCloud(app.screen.width * 0.6, 50 * PIXEL_SCALE, PIXEL_SCALE);

                grassFieldGraphics = drawGrassField(app)

                fenceGraphics = drawPixelFence(app, PIXEL_SCALE)

                const signpost = drawSignpost(app, habit.rabbitName, PIXEL_SCALE)
                signpostGraphics = signpost.Graphics
                rabbitNameText = signpost.Text

                await Assets.load(BUNNY_SHEET)
                const baseTexture = Assets.get(BUNNY_SHEET).source

                const frames: PIXI.Texture[] = []

                const framesPerRow = 4
                let frameCount = 0

                for (let row = 0; row < 6; row++) {
                    const framesInThisRow = (row === 5) ? 3 : framesPerRow

                    for (let col = 0; col < framesInThisRow; col++) {
                        if (frameCount >= BUNNY_TOTAL_FRAMES) break

                        const rect = new Rectangle(
                            col * BUNNY_FRAME_WIDTH,
                            row * BUNNY_FRAME_HEIGHT,
                            BUNNY_FRAME_WIDTH,
                            BUNNY_FRAME_HEIGHT
                        )

                        const texture = new Texture({ source: baseTexture, frame: rect })
                        frames.push(texture)
                        frameCount++
                    }
                }

                const idleFrames1 = frames.slice(IDLE_START1, IDLE_END1)
                const idleFrames2 = frames.slice(IDLE_START2, IDLE_END2)
                const idleFrames = [...idleFrames1, ...idleFrames2, idleFrames2[5], idleFrames2[5]]
                const walkFrames = frames.slice(WALK_START, WALK_END)
                const hungryFramesBase = frames.slice(HUNGRY_START, HUNGRY_END)
                const hungryFrames = [...hungryFramesBase, hungryFramesBase[5]]

                if (isEscaped) {
                    escapedHoleGraphics = new Graphics()
                    const holeSize = 40 * PIXEL_SCALE

                    escapedHoleGraphics
                        .ellipse(0, 0, holeSize * 0.8, holeSize * 0.4)
                        .fill(0x333333)

                    // 굴을 클릭 가능하게 설정하고 모달 연결
                    escapedHoleGraphics.eventMode = 'static'
                    escapedHoleGraphics.cursor = 'pointer'
                    escapedHoleGraphics.on('pointertap', handleOpenModal)

                } else {
                    const initialFrames = isHungry ? hungryFrames : idleFrames
                    bunnySprite = new AnimatedSprite(initialFrames)

                    bunnySprite.scale.set(PIXEL_SCALE)
                    bunnySprite.anchor.set(0.5, 1)
                    bunnySprite.animationSpeed = BUNNY_ANIMATION_SPEED
                    bunnySprite.play()

                    bunnySprite.eventMode = 'static'
                    bunnySprite.cursor = 'pointer'
                    bunnySprite.on('pointertap', handleOpenModal)
                }

                app.stage.addChild(
                    skyGraphics,          // 0. 하늘
                    cloud1Graphics,       // 1. 구름
                    cloud2Graphics,       // 2. 구름
                    grassFieldGraphics,   // 3. 잔디밭
                    fenceGraphics,        // 4. 울타리
                    signpostGraphics,     // 5. 팻말 Graphics
                    rabbitNameText,       // 7. 팻말 Text (팻말 Graphics 위에 오도록)
                )

                if (isEscaped && escapedHoleGraphics) {
                    app.stage.addChild(escapedHoleGraphics) // 6. 토끼 (팻말보다 위에 오도록 순서 조정)
                } else if (bunnySprite) {
                    app.stage.addChild(bunnySprite)         // 7. 토끼굴 (도망간 토끼)
                }

                if (!isHungry && !isEscaped) {
                    app.canvas.addEventListener('pointerdown', (e) => {
                        if (bunnySprite) {
                            const canvasRect = app.canvas.getBoundingClientRect()

                            targetX = (e.clientX - canvasRect.left) * (app.screen.width / canvasRect.width)
                            targetY = (e.clientY - canvasRect.top) * (app.screen.height / canvasRect.height)

                            isMoving = true
                            idleTimer = 0
                        }
                    })
                }

                app.ticker.add((ticker) => {
                    if (isEscaped) {
                        return
                    }

                    if (!bunnySprite) {
                        return
                    }

                    const delta = ticker.deltaMS / (1000 / 60)

                    if (isHungry) {
                        if (bunnySprite.textures !== hungryFrames) {
                            bunnySprite.textures = hungryFrames
                            bunnySprite.play()
                        }
                    } else {
                        if (isMoving && targetX !== null && targetY !== null) {
                            const dx = targetX - bunnySprite.x
                            const dy = targetY - bunnySprite.y

                            const distance = Math.sqrt(dx * dx + dy * dy)

                            if (distance < bunnySpeed) {
                                bunnySprite.x = targetX
                                bunnySprite.y = targetY
                                isMoving = false
                                targetX = null
                                targetY = null
                            } else {
                                const ratio = (bunnySpeed * delta) / distance
                                const moveX = dx * ratio
                                const moveY = dy * ratio

                                bunnyDirection = dx > 0 ? 1 : -1

                                if (bunnyDirection === 1) {
                                    bunnySprite.scale.x = -PIXEL_SCALE
                                } else {
                                    bunnySprite.scale.x = +PIXEL_SCALE
                                }

                                bunnySprite.x += moveX
                                bunnySprite.y += moveY

                                if (bunnySprite.textures !== walkFrames) {
                                    bunnySprite.textures = walkFrames
                                    bunnySprite.play()
                                }
                                idleTimer = 0
                            }
                        }

                        if (!isMoving) {
                            idleTimer += ticker.deltaMS

                            if (idleTimer >= idleDelayMS) {
                                if (bunnySprite.textures !== idleFrames) {
                                    bunnySprite.textures = idleFrames
                                    bunnySprite.play()
                                }
                            }
                        }
                    }
                })

                const handleResize = () => {
                    if (appRef.current && skyGraphics && cloud1Graphics && cloud2Graphics && grassFieldGraphics
                        && fenceGraphics && (bunnySprite || escapedHoleGraphics) && signpostGraphics && rabbitNameText) {
                        const currentApp = appRef.current
                        currentApp.resize()

                        skyGraphics.clear()
                        cloud1Graphics.clear()
                        cloud2Graphics.clear()
                        grassFieldGraphics.clear()
                        fenceGraphics.clear()
                        signpostGraphics.clear()

                        skyGraphics = drawSky(currentApp)
                        cloud1Graphics = createCloud(currentApp.screen.width * 0.1, 20 * PIXEL_SCALE, PIXEL_SCALE)
                        cloud2Graphics = createCloud(currentApp.screen.width * 0.6, 50 * PIXEL_SCALE, PIXEL_SCALE)
                        grassFieldGraphics = drawGrassField(currentApp)
                        fenceGraphics = drawPixelFence(currentApp, PIXEL_SCALE)

                        const signpost = drawSignpost(currentApp, habit.rabbitName, PIXEL_SCALE)
                        signpostGraphics = signpost.Graphics

                        rabbitNameText.style = signpost.Text.style
                        rabbitNameText.text = signpost.Text.text
                        rabbitNameText.x = signpost.Text.x
                        rabbitNameText.y = signpost.Text.y

                        const centerX = currentApp.screen.width / 2
                        const centerY = currentApp.screen.height / 2 + 80 * PIXEL_SCALE

                        if (isEscaped && escapedHoleGraphics) {
                            escapedHoleGraphics.x = centerX
                            escapedHoleGraphics.y = centerY
                        } else if (bunnySprite) {
                            bunnySprite.x = centerX
                            bunnySprite.y = centerY
                        }

                        app.stage.removeChildren()
                        app.stage.addChild(
                            skyGraphics,
                            cloud1Graphics,
                            cloud2Graphics,
                            grassFieldGraphics,
                            fenceGraphics,
                            signpostGraphics,
                            rabbitNameText,
                        )
                        if (isEscaped && escapedHoleGraphics) {
                            app.stage.addChild(escapedHoleGraphics)
                        } else if (bunnySprite) {
                            app.stage.addChild(bunnySprite)
                        }
                    }
                }

                handleResizeRef.current = handleResize
                window.addEventListener('resize', handleResizeRef.current)

                handleResize()

            } catch (error) {
                console.error("PixiJS initialization failed:", error)
            }
        };

        initializePixi().then(() => {})

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
            if (handleResizeRef.current) {
                window.removeEventListener('resize', handleResizeRef.current)
            }
        }
    }, [habit])

    return (
        <div className="flex flex-col h-full w-full items-center">
            {/* 토끼 상태 모달 */}
            <RabbitModal
                open={isModalOpen}
                onClose={handleCloseModal}
                rabbitName={habit.rabbitName}
                rabbitStatus={habit.rabbitStatus}
                combo={habit.combo}
                habitId={habit.habitId.toString()}
            />

            <div
                className="w-full max-w-full relative"
                style={{
                    height: 'calc(100vh - 56px)',
                }}
            >
                {/* pixi 캔버스 */}
                <div
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{
                        overflow: 'hidden',
                    }}
                />

                {/* 하단 버튼 */}
                <div
                    className="flex w-full p-4"
                    style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "0",
                        right: "0",
                        zIndex: 10,
                    }}
                >
                    {/* 왼쪽 영역 */}
                    <div className="flex justify-center w-1/2">
                        <button
                            className="bg-red-50 text-red-600 font-semibold py-2.5 px-8 sm:px-12 rounded-2xl border border-red-200 text-base sm:text-lg"
                            onClick={() => {
                                if (habit.channelId) {
                                    router.push(`/chat/${habit.channelId}`)
                                }
                            }}
                        >
                            채팅하기
                        </button>
                    </div>

                    {/* 오른쪽 영역 */}
                    <div className="flex justify-center w-1/2">
                        <button
                            className="bg-amber-50 text-amber-600 font-semibold py-2.5 px-8 sm:px-12 rounded-2xl border border-amber-200 text-base sm:text-lg"
                            onClick={() => router.push(`/habits/${habit.habitId}`)}
                        >
                            상세보기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainComponent;