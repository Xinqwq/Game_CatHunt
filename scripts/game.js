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
            
            this.musicList.forEach(music => {
                const option = document.createElement('option');
                option.value = music.file;
                option.textContent = music.name;
                select.appendChild(option);
            });

            // 播放第一首歌
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
        const positions = [];
        const catSize = 80;
        const minDistance = catSize * 1.2;

        for (let i = 0; i < this.totalCats; i++) {
            let newPosition;
            let overlap;
            do {
                overlap = false;
                newPosition = this.getRandomPosition();
                
                for (const pos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(newPosition.x - pos.x, 2) + 
                        Math.pow(newPosition.y - pos.y, 2)
                    );
                    if (distance < minDistance) {
                        overlap = true;
                        break;
                    }
                }
            } while (overlap);
            
            positions.push(newPosition);
        }
        return positions;
    }

    createCat(index) {
        const cat = document.createElement('div');
        cat.className = 'cat';
        cat.innerHTML = getRandomCatImage(index);
        
        // 限制旋转角度在 -30 到 30 度之间
        const rotation = (Math.random() * 60) - 30;
        cat.style.transform = `rotate(${rotation}deg)`;
        
        cat.addEventListener('click', () => this.onCatClick(cat));
        return cat;
    }

    getRandomPosition() {
        const maxX = this.gameArea.clientWidth - 80;
        const maxY = this.gameArea.clientHeight - 80;
        return {
            x: Math.random() * maxX,
            y: Math.random() * maxY
        };
    }

    onCatClick(cat) {
        if (!cat.classList.contains('found')) {
            cat.classList.add('found');
            
            // 保存原有的旋转
            const originalRotation = cat.style.transform;
            
            // 设置随机颜色
            const color = this.getRandomColor();
            const svg = cat.querySelector('svg');
            if (svg) {
                svg.style.fill = color;
            }
            
            // 添加点击动画，保持原有旋转
            cat.style.transform = `${originalRotation} scale(1.3)`;
            setTimeout(() => {
                cat.style.transform = originalRotation;
            }, 200);
            
            // 播放音效
            this.sounds.find.currentTime = 0;
            this.sounds.find.play();
            
            this.foundCats++;
            this.foundCounter.textContent = this.foundCats;
            
            if (this.foundCats === this.totalCats) {
                this.showWinMessage();
            }
        }
    }

    getRandomColor() {
        // 使用更鲜艳的颜色
        const colors = [
            '#FF0000', // 红
            '#FF7F00', // 橙
            '#FFFF00', // 黄
            '#00FF00', // 绿
            '#0000FF', // 蓝
            '#4B0082', // 靛
            '#8B00FF'  // 紫
        ];
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
        this.winMessage.style.display = 'flex';
        
        // 修改按钮文本
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.innerHTML = '<i class="fas fa-redo"></i><span>Restart</span>';
        }
    }

    restart() {
        // 停止计时器
        this.stopTimer();
        
        // 确保胜利消息是隐藏的
        if (this.winMessage) {
            this.winMessage.style.display = 'none';
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

// 修改初始化方式
window.addEventListener('load', async () => {
    const restartBtn = document.getElementById('restart-btn');
    const gameArea = document.getElementById('game-area');
    const winMessage = document.getElementById('win-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // 确保胜利消息一开始是隐藏的
    if (winMessage) {
        winMessage.style.display = 'none';
    }
    
    // 统一处理所有重启相关的按钮点击事件
    async function handleGameStart() {
        if (!game) {
            // 清空游戏区域
            if (gameArea) {
                gameArea.innerHTML = '<div class="loading">Loading...</div>';
            }
            // 初始化游戏
            game = await initializeGame();
            if (game) {
                restartBtn.innerHTML = '<i class="fas fa-redo"></i><span>Restart</span>';
            }
        } else {
            game.restart();
        }
    }
    
    // 绑定按钮事件
    if (restartBtn) {
        restartBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Game</span>';
        restartBtn.addEventListener('click', handleGameStart);
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', handleGameStart);
    }

    // 显示开始游戏提示
    if (gameArea) {
        gameArea.innerHTML = `
            <div class="start-message">
                <h1>Christmas Cat Hunt</h1>
                <p>Find all the hidden cats!</p>
                <p>Click "Start Game" to begin</p>
            </div>
        `;
    }
}); 