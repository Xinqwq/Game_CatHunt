class CatGame {
    constructor() {
        this.totalCats = 50;
        this.foundCats = 0;
        this.gameArea = document.getElementById('game-area');
        this.foundCounter = document.getElementById('found');
        this.totalCounter = document.getElementById('total');
        this.winMessage = document.getElementById('win-message');
        this.timer = document.getElementById('timer');
        this.startTime = Date.now();
        
        // 音效初始化
        this.sounds = {
            find: new Audio('assets/sounds/find.mp3'),
            win: new Audio('assets/sounds/win.mp3')
        };
        
        // 添加音效加载错误处理
        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('error', (e) => {
                console.warn('音效加载失败，游戏将继续但没有音效:', e);
            });
        });
        
        this.initialize();
        this.startTimer();
        
        // 添加音乐列表和当前播放索引
        this.musicList = [];
        this.currentMusicIndex = -1;
        
        // 添加BGM相关
        this.bgmPlayer = new Audio();
        this.bgmPlayer.addEventListener('ended', () => this.playRandomNextSong());
        this.initializeBGM();
        
        // 加载最佳记录
        this.bestTime = localStorage.getItem('bestTime') ? 
            parseInt(localStorage.getItem('bestTime')) : Infinity;
        
        // 添加找到的猫咪颜色记录
        this.foundCatColors = new Map();
        
        // 确保胜利消息一开始是隐藏的
        this.winMessage.style.display = 'none';
    }

    playRandomNextSong() {
        if (this.musicList.length <= 1) return;
        
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.musicList.length);
        } while (nextIndex === this.currentMusicIndex);
        
        this.currentMusicIndex = nextIndex;
        const nextSong = this.musicList[nextIndex];
        
        document.getElementById('bgm-select').value = nextSong.file;
        this.bgmPlayer.src = `assets/music/${nextSong.file}`;
        this.bgmPlayer.play();
    }

    async initializeBGM() {
        try {
            const response = await fetch('assets/music/list.json');
            this.musicList = await response.json();
            
            const select = document.getElementById('bgm-select');
            select.innerHTML = '';
            
            // 过滤掉不可用的音乐
            this.musicList = this.musicList.filter(music => {
                try {
                    const audio = new Audio(`assets/music/${music.file}`);
                    return true;
                } catch (e) {
                    console.warn(`Music file not available: ${music.file}`);
                    return false;
                }
            });

            this.musicList.forEach(music => {
                const option = document.createElement('option');
                option.value = music.file;
                option.textContent = music.name;
                select.appendChild(option);
            });

            // 播放第一首有效的音乐
            if (this.musicList.length > 0) {
                this.currentMusicIndex = 0;
                const firstMusic = this.musicList[0];
                select.value = firstMusic.file;
                this.bgmPlayer.src = `assets/music/${firstMusic.file}`;
                this.bgmPlayer.play().catch(error => {
                    console.warn('Auto-play failed:', error);
                });
            }

            select.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.currentMusicIndex = this.musicList.findIndex(m => m.file === e.target.value);
                    this.bgmPlayer.src = `assets/music/${e.target.value}`;
                    this.bgmPlayer.play();
                } else {
                    this.bgmPlayer.pause();
                }
            });
        } catch (error) {
            console.error('Failed to load music list:', error);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    initialize() {
        this.totalCounter.textContent = this.totalCats;
        this.placeCats();
    }

    placeCats() {
        const positions = this.generateNonOverlappingPositions();
        positions.forEach((position, i) => {
            const cat = this.createCat(i);
            cat.style.left = position.x + 'px';
            cat.style.top = position.y + 'px';
            this.gameArea.appendChild(cat);
        });
    }

    generateNonOverlappingPositions() {
        try {
            const positions = [];
            const gameAreaWidth = this.gameArea.clientWidth || window.innerWidth;
            const gameAreaHeight = this.gameArea.clientHeight || window.innerHeight;
            
            // 使用 let 而不是 const
            let minDistance = Math.min(80, Math.min(gameAreaWidth, gameAreaHeight) * 0.1);
            const padding = 20;
            
            for (let i = 0; i < this.totalCats; i++) {
                let position;
                let overlap;
                let attempts = 0;
                
                do {
                    overlap = false;
                    position = {
                        x: padding + Math.random() * (gameAreaWidth - minDistance - padding * 2),
                        y: padding + Math.random() * (gameAreaHeight - minDistance - padding * 2)
                    };
                    
                    for (const pos of positions) {
                        const distance = Math.sqrt(
                            Math.pow(position.x - pos.x, 2) + 
                            Math.pow(position.y - pos.y, 2)
                        );
                        if (distance < minDistance) {
                            overlap = true;
                            break;
                        }
                    }
                    
                    attempts++;
                    if (attempts > 100) {
                        minDistance *= 0.9;
                        attempts = 0;
                    }
                } while (overlap && minDistance > 20);
                
                positions.push(position);
            }
            
            return positions;
        } catch (error) {
            console.error('Error in generateNonOverlappingPositions:', error);
            // 提供一个后备方案
            return Array.from({ length: this.totalCats }, () => ({
                x: Math.random() * (this.gameArea.clientWidth - 80),
                y: Math.random() * (this.gameArea.clientHeight - 80)
            }));
        }
    }

    createCat(index) {
        const cat = document.createElement('div');
        cat.className = 'cat';
        cat.innerHTML = getRandomCatImage(index);
        
        // 限制旋转度在 -30 到 30 度之间
        const rotation = (Math.random() * 60) - 30;
        cat.style.transform = `rotate(${rotation}deg)`;
        
        cat.addEventListener('click', () => this.onCatClick(cat));
        return cat;
    }

    getRandomPosition() {
        const catSize = Math.min(80, window.innerWidth * 0.15);
        const padding = 20;
        
        const maxX = this.gameArea.clientWidth - catSize - (padding * 2);
        const maxY = this.gameArea.clientHeight - catSize - (padding * 2);
        
        return {
            x: padding + (Math.random() * maxX),
            y: padding + (Math.random() * maxY)
        };
    }

    onCatClick(cat) {
        if (!cat.classList.contains('found')) {
            cat.classList.add('found');
            
            // 保存原有的旋转
            const originalRotation = cat.style.transform;
            
            // 设置随机颜色
            const color = this.getRandomColor();
            const element = cat.querySelector('svg, img');
            if (element) {
                if (element.tagName.toLowerCase() === 'svg') {
                    // 对于SVG，直接填充颜色
                    const paths = element.querySelectorAll('path');
                    paths.forEach(path => {
                        path.style.fill = color;
                        path.style.stroke = '#000';
                        path.style.strokeWidth = '1px';
                    });
                } else {
                    // 对于PNG图片，使用滤镜效果
                    element.style.filter = `
                        brightness(1.2)
                        opacity(0.9)
                        drop-shadow(0 0 2px ${color})
                    `;
                }
            }
            
            // 添加点击动画
            cat.style.transform = `${originalRotation} scale(1.3)`;
            setTimeout(() => {
                cat.style.transform = originalRotation;
            }, 200);
            
            // 播放音效
            this.sounds.find.currentTime = 0;
            this.sounds.find.play();
            
            // 更新计数器并添加动画效果
            this.foundCats++;
            this.foundCounter.textContent = this.foundCats;
            
            // 添加计数器动画效果
            const foundDisplay = document.querySelector('.control-item:nth-child(2)');
            foundDisplay.classList.add('counter-animation');
            setTimeout(() => {
                foundDisplay.classList.remove('counter-animation');
            }, 500);
            
            if (this.foundCats === this.totalCats) {
                this.showWinMessage();
            }
        }
    }

    getRandomColor() {
        // 赛博朋克风格的霓虹色系
        const colors = [
            '#8a2be2',  // 霓虹紫
            '#ff1493',  // 亮粉红
            '#00ffff',  // 电光蓝
            '#39ff14',  // 霓虹绿
            '#ffd700',  // 赛博黄
            '#00b7eb',  // 金属青蓝
            '#ff4500',  // 赛博橙
            '#bfff00',  // 青柠绿
            '#ff5555',  // 烈焰红
            '#ff00ff',  // 霓虹紫红
            '#00e5ff',  // 虚拟青色
            '#6a0dad',  // 蓝紫色
            '#483d8b'   // 炫目紫蓝
        ];
        // 不使用深夜黑和金属灰，因为它们太暗了，可能影响可见度
        
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showWinMessage() {
        this.stopTimer();
        this.sounds.win.play();
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - this.startTime) / 1000);
        
        // 检查是否是新记录
        const isNewRecord = timeSpent < this.bestTime;
        if (isNewRecord) {
            this.bestTime = timeSpent;
            localStorage.setItem('bestTime', timeSpent.toString());
        }

        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        
        // 更新胜利时间显示
        const winTimeElement = document.getElementById('win-time');
        if (winTimeElement) {
            winTimeElement.textContent = `${minutes}m ${seconds}s`;
        }
        
        // 显示新记录消息
        const recordMessage = document.getElementById('record-message');
        if (recordMessage) {
            recordMessage.classList.toggle('hidden', !isNewRecord);
        }
        
        // 显示胜利消息
        const winMessage = document.getElementById('win-message');
        if (winMessage) {
            // 移除所有可能的隐藏样式
            winMessage.style.removeProperty('display');
            winMessage.style.removeProperty('visibility');
            winMessage.classList.remove('hidden');
            
            // 强制显示
            winMessage.style.display = 'flex';
            winMessage.style.visibility = 'visible';
            
            // 确保在 DOM 更新后显示
            requestAnimationFrame(() => {
                winMessage.style.display = 'flex';
                winMessage.style.visibility = 'visible';
            });
        }
    }

    restart() {
        // 停止计时器
        this.stopTimer();
        
        // 隐藏胜利消息
        const winMessage = document.getElementById('win-message');
        if (winMessage) {
            winMessage.style.display = 'none';
            winMessage.style.visibility = 'hidden';
        }
        
        // 清空游戏区域
        if (this.gameArea) {
            this.gameArea.innerHTML = '';
        }
        
        // 重置计数器
        this.foundCats = 0;
        if (this.foundCounter) {
            this.foundCounter.textContent = '0';
        }
        
        // 重置计时器
        this.startTime = Date.now();
        this.startTimer();
        
        // 重新初始化游戏
        this.initialize();
        
        // 保持音乐播放
        if (this.bgmPlayer && this.bgmPlayer.src) {
            this.bgmPlayer.play().catch(e => console.warn('Failed to play music:', e));
        }
        
        // 清空找到的猫咪颜色记录
        this.foundCatColors.clear();
    }
}

// 创建全局游戏实例
let game = null;

// 修改初始化部分
window.addEventListener('DOMContentLoaded', async () => {
    const restartBtn = document.getElementById('restart-btn');
    const gameArea = document.getElementById('game-area');
    const winMessage = document.getElementById('win-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // 立即隐藏胜利消息
    if (winMessage) {
        winMessage.style.display = 'none';
        winMessage.style.visibility = 'hidden'; // 添加额外的隐藏保证
    }
    
    // 统一的游戏启动函数
    async function startGame() {
        try {
            if (winMessage) {
                winMessage.style.display = 'none';
                winMessage.style.visibility = 'hidden';
            }
            
            if (gameArea) {
                gameArea.innerHTML = '<div class="loading">Loading...</div>';
            }
            
            // 等待资源加载完成
            await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟确保DOM更新
            game = await initializeGame();
            
            if (game && restartBtn) {
                restartBtn.innerHTML = '<i class="fas fa-redo"></i><span>Restart</span>';
            }
        } catch (error) {
            console.error('Game initialization failed:', error);
            if (gameArea) {
                gameArea.innerHTML = '<div class="error">Failed to start game. Please refresh the page.</div>';
            }
        }
    }
    
    // 确保开始界面在所有资源加载完成后显示
    window.addEventListener('load', () => {
        if (gameArea && !game) {
            gameArea.innerHTML = `
                <div class="start-message">
                    <h1>Christmas Cat Hunt</h1>
                    <p>Find all the hidden cats!</p>
                    <button id="start-game-btn" class="control-item">
                        <i class="fas fa-play"></i>
                        Start Game
                    </button>
                </div>
            `;
            
            // 重新绑定开始按钮事件
            const startGameBtn = document.getElementById('start-game-btn');
            if (startGameBtn) {
                startGameBtn.addEventListener('click', startGame);
            }
        }
    });
    
    // 绑定按钮事件
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (!game) {
                startGame();
            } else {
                game.restart();
            }
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            if (game) {
                game.restart();
            } else {
                startGame();
            }
        });
    }
}); 