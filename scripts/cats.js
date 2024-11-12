const catSvgs = [];
const catPngs = [];

async function loadCatImages() {
    // 加载SVG和PNG
    const svgFiles = Array.from({length: 16}, (_, i) => `assets/cats/${i + 1}.svg`);
    const pngFiles = Array.from({length: 26}, (_, i) => `assets/cats/cat_${i + 1}.png`);

    try {
        // 加载SVG
        const svgPromises = svgFiles.map(file => 
            fetch(file)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.text();
                })
                .then(text => ({ type: 'svg', content: text }))
                .catch(error => {
                    console.warn(`Failed to load SVG: ${file}`, error);
                    return null;
                })
        );
        
        // 加载PNG
        const pngPromises = pngFiles.map(file => 
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({
                    type: 'png',
                    content: `<img src="${file}" alt="cat">`
                });
                img.onerror = () => {
                    console.warn(`Failed to load PNG: ${file}`);
                    resolve(null);
                };
                img.src = file;
            })
        );
        
        // 等待所有图片加载完成
        const results = await Promise.all([...svgPromises, ...pngPromises]);
        
        // 过滤掉加载失败的图片
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length === 0) {
            throw new Error('No images loaded successfully');
        }
        
        // 分别存储SVG和PNG
        validResults.forEach(result => {
            if (result.type === 'svg') {
                catSvgs.push(result.content);
            } else {
                catPngs.push(result.content);
            }
        });
        
        console.log(`Successfully loaded ${catSvgs.length} SVGs and ${catPngs.length} PNGs`);
        return true;
    } catch (error) {
        console.error('Error loading cat images:', error);
        return false;
    }
}

function getRandomCatImage(index) {
    // 合并所有图片并随机选择
    const allImages = [...catSvgs, ...catPngs];
    if (allImages.length === 0) return '';
    return allImages[index % allImages.length];
}

async function initializeGame() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '<div class="loading">Loading...</div>';
    
    const success = await loadCatImages();
    
    if (success && (catSvgs.length > 0 || catPngs.length > 0)) {
        gameArea.innerHTML = '';
        return new CatGame();
    } else {
        gameArea.innerHTML = '<div class="error">Failed to load cat images. Please refresh the page.</div>';
        return null;
    }
} 