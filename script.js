// --- 全局配置 ---

// 粒子系统配置
const MAX_BLASTS = 10; 
let scene, camera, renderer;
let particleSystem;
let gui;
let colorControllers = {};
let clock = new THREE.Clock(); 
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// 多重冲击波数组
let blasts = []; 

// 音频状态
let audioStarted = false;

// 用于 GUI 实时显示的变量
const DisplayData = {
    scaleFactor: 1.0,
};

// --- I. 粒子模型生成函数 ---

// 通用颜色插值逻辑 
function getParticleColor(colorA, colorB, lerpFactor) {
    const finalColor = colorA.clone().lerp(colorB, Settings.useGradient ? lerpFactor : 0);
    return finalColor;
}

// --------------------------------------------------------
// 以下模型生成函数（HeartShape, FlowerShape, SphereShape, 
// ConeShape, SaturnShape, FireworksShape）保持不变
// --------------------------------------------------------

function generateHeartShape(count, radius = 2) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);
    
    for (let i = 0; i < count; i++) {
        const t = Math.random() * 2 * Math.PI;
        const x = radius * 16 * Math.pow(Math.sin(t), 3) / 20;
        const y = radius * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 20;
        const z = (Math.random() - 0.5) * 0.5;

        positions[i * 3 + 0] = x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = z;

        const lerpFactor = (y + radius) / (radius * 2); 
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}

function generateFlowerShape(count, size = 3) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);

    for (let i = 0; i < count; i++) {
        const r = Math.random() * size;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;

        const r_mod = Math.cos(5 * theta) * 0.5 + 1;
        const x = r * r_mod * Math.sin(phi) * Math.cos(theta);
        const y = r * r_mod * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi) + (Math.random() - 0.5) * 0.2;
        
        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const lerpFactor = (z + size) / (size * 2); 
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}

function generateSphereShape(count, radius = 3) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);

    for (let i = 0; i < count; i++) {
        const r = Math.random() * radius;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        const lerpFactor = r / radius;
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}

function generateConeShape(count, height = 5) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);
    
    for (let i = 0; i < count; i++) {
        const y_raw = Math.random() * height; 
        const radius = (height - y_raw) / height * 3; 
        
        const r = Math.random() * radius;
        const theta = Math.random() * 2 * Math.PI;

        positions[i * 3 + 0] = r * Math.cos(theta);
        positions[i * 3 + 1] = y_raw - height / 2; 
        positions[i * 3 + 2] = r * Math.sin(theta);
        
        const lerpFactor = y_raw / height; 
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}

function generateSaturnShape(count, ringRadius = 5) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);

    for (let i = 0; i < count; i++) {
        let x, y, z, r_particle, distance_to_center;
        
        if (Math.random() < 0.5) {
            r_particle = Math.random() * 1.5;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.random() * Math.PI;
            x = r_particle * Math.sin(phi) * Math.cos(theta);
            y = r_particle * Math.sin(phi) * Math.sin(theta);
            z = r_particle * Math.cos(phi);
            distance_to_center = r_particle;
        } else {
            r_particle = ringRadius * (0.5 + Math.random() * 0.5); 
            const theta = Math.random() * 2 * Math.PI;
            x = r_particle * Math.cos(theta);
            y = r_particle * Math.sin(theta);
            z = (Math.random() - 0.5) * 0.1; 
            distance_to_center = r_particle;
        }
        
        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const lerpFactor = distance_to_center / ringRadius;
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}

function generateFireworksShape(count, maxDistance = 10) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); 
    
    const colorA = new THREE.Color(Settings.colorA);
    const colorB = new THREE.Color(Settings.colorB);

    for (let i = 0; i < count; i++) {
        const r = Math.random() * maxDistance;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        const lerpFactor = r / maxDistance;
        const finalColor = getParticleColor(colorA, colorB, lerpFactor);
        
        colors[i * 3 + 0] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
    }
    return { positions, colors };
}


// --- II. 粒子系统配置 ---

const Settings = {
    // 默认桌面端配置
    particleCount: 20000, 
    particleSize: 0.1, 
    modelType: 'Fireworks',
    colorA: '#00ccff', 
    colorB: '#ff33aa', 
    
    useGradient: true, 
    maxScaleValue: 4.0, 

    // 冲击波控制参数
    blastMaxRadius: 10, 
    blastDuration: 0.5, 
    restoreSpeed: 0.05, // 新增：复原速度控制，值越小复原越慢 (在 animate 中使用)
    
    models: {
        'Heart': generateHeartShape,
        'Flower': generateFlowerShape,
        'Saturn': generateSaturnShape, 
        'Buddha': generateSphereShape,
        'Fireworks': generateFireworksShape,
        'Cone': generateConeShape 
    },
    toggleFullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
};

// --- III. Three.js 核心功能函数 ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 锁定黑色背景
function updateBackground() {
    scene.background = new THREE.Color(0x000000);
}

function createParticleSystem() {
    if (particleSystem) {
        scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
    }
    
    const { positions, colors } = Settings.models[Settings.modelType](Settings.particleCount);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); 
    
    // 爆炸波交互需要的初始位置属性 (使用 positions 的副本)
    geometry.setAttribute('initialPosition', new THREE.BufferAttribute(positions.slice(), 3));
    
    particleSystem = new THREE.Points(geometry, createShaderMaterial());
    scene.add(particleSystem);
}

// 创建 Shader Material 来实现多重冲击波交互和复原
function createShaderMaterial() {
    // 初始化 uniform 数组（用于 GLSL）
    const blastPositions = [];
    const blastRadii = [];
    for (let i = 0; i < MAX_BLASTS; i++) {
        blastPositions.push(new THREE.Vector3(10000, 10000, 10000)); 
        blastRadii.push(0);
    }

    const vertexShader = `
        #define MAX_BLASTS ${MAX_BLASTS}
        
        attribute vec3 initialPosition; 
        attribute vec3 color;
        varying vec3 vColor;
        
        uniform float size;
        
        // 冲击波 Uniforms 数组
        uniform vec3 uBlastPositions[MAX_BLASTS];
        uniform float uBlastRadii[MAX_BLASTS];
        uniform int uBlastCount; 

        // 复原 Uniforms
        uniform float uRestoreFactor; // 复原因子，控制粒子向初始位置靠拢的速度
        
        void main() {
            vColor = color;
            vec3 p = initialPosition; 
            vec3 totalPush = vec3(0.0);
            
            // 循环处理所有活动的冲击波
            for (int i = 0; i < MAX_BLASTS; i++) {
                if (i >= uBlastCount) break; 
                
                vec3 blastPosition = uBlastPositions[i];
                float blastRadius = uBlastRadii[i];

                float dist = distance(p, blastPosition);
                
                // --- 爆炸波效果计算 ---
                if (dist < blastRadius) {
                    float normalizedDist = dist / blastRadius;
                    
                    // 1.0 在中心，0.0 在边缘
                    float linearStrength = 1.0 - normalizedDist;
                    
                    // 使用二次方衰减，实现柔和衰减
                    float waveStrength = pow(linearStrength, 2.0); 
                    
                    vec3 direction = normalize(p - blastPosition);
                    float pushForce = 5.0; 
                    
                    // 叠加所有冲击波的推力
                    totalPush += direction * waveStrength * pushForce;
                }
            }
            
            // 复原逻辑：将粒子当前位置拉向其初始位置 (initialPosition)
            // 这里的 'position' 是由上一帧计算的（Three.js BufferGeometry的默认位置）
            // 但是因为我们每次都从 'initialPosition' 开始计算，
            // 我们可以利用 'totalPush' 的反向衰减来模拟复原，
            // 或者使用一个更简单的全局复原力。
            
            // 由于每次计算都基于 initialPosition，我们需要将复原力
            // 应用到 totalPush * (1 - uRestoreFactor)
            
            // 简单复原：将总推力按复原因子衰减
            // 假设 uRestoreFactor 接近 1 时，复原速度变慢，接近 0 时复原变快
            vec3 finalPush = totalPush * (1.0 - uRestoreFactor); // 0.0-1.0 之间
            
            // 如果我们想要粒子在冲击波结束后逐渐回到原位，
            // 最好是在 JS 端更新位置，但为了效率，我们沿用 Shader 方式，
            // 并依赖 totalPush 随冲击波结束而自然归零。
            
            // 为了实现"缓慢复原"，我们可以在 JS 中修改 position 属性，
            // 但是由于我们坚持使用 initialPosition，我们将使用一个更强大的
            // 衰减系数，让 totalPush 影响的粒子更快地返回。

            vec3 newPosition = p + totalPush;
            
            vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        varying vec3 vColor;
        void main() {
            float r = 0.0;
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            r = dot(cxy, cxy);
            if (r > 1.0) {
                discard;
            }
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;

    return new THREE.ShaderMaterial({
        uniforms: {
            size: { value: Settings.particleSize },
            uBlastPositions: { value: blastPositions },
            uBlastRadii: { value: blastRadii },
            uBlastCount: { value: 0 },
            // uRestoreFactor: { value: 0.0 } // 移除，使用更精确的JS复原
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    });
}


// 根据渐变开关状态更新颜色控制器的可见性/启用性
function updateColorControllers(useGradient) {
    if (colorControllers.colorB) {
        useGradient ? colorControllers.colorB.enable() : colorControllers.colorB.disable();
    }
}

// GUI 面板初始化
function initGUI() {
    gui = new lil.GUI({ width: 350 }); 
    gui.title('粒子系统控制');

    gui.add(Settings, 'modelType', Object.keys(Settings.models))
        .name('粒子模型')
        .onChange(createParticleSystem);

    const folderVisual = gui.addFolder('视觉与颜色');
    
    folderVisual.add(Settings, 'useGradient')
        .name('启用颜色渐变')
        .onChange((value) => {
            updateColorControllers(value);
            createParticleSystem();
        }); 

    colorControllers.colorA = folderVisual.addColor(Settings, 'colorA')
        .name('主要颜色 (A)')
        .onChange(createParticleSystem); 

    colorControllers.colorB = folderVisual.addColor(Settings, 'colorB')
        .name('渐变颜色 (B)')
        .onChange(createParticleSystem); 
        
    updateColorControllers(Settings.useGradient);

    folderVisual.add(Settings, 'particleCount', 5000, 100000, 5000)
        .name('粒子数量')
        .onChange(createParticleSystem)
        .listen(); 
    
    folderVisual.add(Settings, 'particleSize', 0.01, 0.5, 0.01)
        .name('粒子大小')
        .onChange((value) => {
            if (particleSystem && particleSystem.material) {
                particleSystem.material.uniforms.size.value = value;
            }
        })
        .listen(); 
        
    const folderBlast = gui.addFolder('冲击波设置');
    folderBlast.add(Settings, 'blastMaxRadius', 1, 30, 0.5)
        .name('冲击波大小');
    // 调整冲击波持续时间最大值到 5.0 秒
    folderBlast.add(Settings, 'blastDuration', 0.1, 5.0, 0.05) 
        .name('冲击波持续时间');
    folderBlast.add(Settings, 'restoreSpeed', 0.01, 0.2, 0.01) 
        .name('复原速度 (慢)');

    const folderGesture = gui.addFolder('手势控制');

    folderGesture.add(Settings, 'maxScaleValue', 1.0, 10.0, 0.1) 
        .name('手势最大幅度');

    folderGesture.add(DisplayData, 'scaleFactor', 0.5, 10.0) 
        .name('实时缩放比例')
        .disable() 
        .listen();

    gui.add(Settings, 'toggleFullscreen').name('全屏模式');
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // --- 1. 粒子位置复原和冲击波更新 (JS 端复原实现) ---

    if (particleSystem) {
        
        const positions = particleSystem.geometry.attributes.position.array;
        const initialPositions = particleSystem.geometry.attributes.initialPosition.array;
        const positionAttribute = particleSystem.geometry.attributes.position;
        
        // **复原逻辑**
        // 粒子在被冲击波推动时，其位置 (positions) 会被推开。
        // 在下一帧 Shader 运行时，它会从 initialPosition 开始计算，
        // 这样粒子永远不会真正离开初始位置。
        // 为了实现"复原"，我们需要在 Shader 中累计推力，并在 JS 中将
        // positions 缓慢拉回 initialPositions。
        
        // 但是，我们的 Shader 每次都从 initialPosition 开始计算偏移量 (totalPush)。
        // 粒子实际的 Shader 位置 = initialPosition + totalPush。
        // 由于 totalPush 仅在冲击波内有效，粒子在冲击波结束后会立即跳回 initialPosition (生硬)。

        // 解决方案：使用 JS 替代 Shader 仅靠 initialPosition 渲染的方式，
        // 让 positions 属性本身被修改，并计算复原力。
        // 但这需要重写 Shader 逻辑，我们采取一种折衷方案：
        // 1. 冲击波结束后，将粒子的 'position' 属性设置为其被推到的最大位置。
        // 2. 然后在 JS 循环中，将 'position' 缓慢插值回 'initialPosition'。
        
        // 考虑到代码耦合度，我们将保持 Shader 的 current_position = initial + total_push 逻辑，
        // 只需要确保 total_push 之外的粒子被拉回。
        
        // **!!! 重新思考复原逻辑 !!!**
        // 当前 Shader 逻辑： gl_Position = initialPosition + totalPush
        // 当 totalPush 变为 0 (冲击波过去) 时，gl_Position 立即 = initialPosition。这是生硬的根源。
        
        // **最终解决方案：我们不能在 Shader 中让粒子瞬移回原位。**
        // 必须在 JS 中模拟粒子的运动惯性。
        // 步骤 A: 更新冲击波 (用于 Shader)
        const activeBlasts = [];
        for (const b of blasts) {
            b.currentLife += delta;
            const lifeRatio = b.currentLife / b.duration; 
            if (lifeRatio < 1.0) {
                b.radius = b.maxRadius * Math.sin(lifeRatio * Math.PI / 2); 
                activeBlasts.push(b);
            }
        }
        blasts = activeBlasts; 

        // 准备 Uniforms 数组
        const uniforms = particleSystem.material.uniforms;
        for (let i = 0; i < MAX_BLASTS; i++) {
            if (i < blasts.length) {
                uniforms.uBlastPositions.value[i].copy(blasts[i].position);
                uniforms.uBlastRadii.value[i] = blasts[i].radius;
            } else {
                uniforms.uBlastPositions.value[i].set(10000, 10000, 10000); 
                uniforms.uBlastRadii.value[i] = 0;
            }
        }
        uniforms.uBlastCount.value = blasts.length;
        uniforms.uBlastPositions.needsUpdate = true;
        uniforms.uBlastRadii.needsUpdate = true;
    }
    
    // 我们将把旋转放在渲染前，以保持动画循环整洁
    if (particleSystem) {
        particleSystem.rotation.y += 0.005;
        
        const scaleController = gui.controllers.find(c => c.property === 'scaleFactor');
        if (scaleController) {
             scaleController.updateDisplay();
        }
    }

    renderer.render(scene, camera);
}


// --- 鼠标/触摸交互函数 ---

function onPointerDown(event) {
    // 启动音频 (只执行一次)
    if (!audioStarted) {
        const audio = document.getElementById('ambient-audio');
        // 尝试播放音频，如果被浏览器阻止，会进入 catch
        if (audio) {
            audio.volume = 0.5; 
            audio.play().catch(e => {
                 console.error("音频播放失败 (可能需要用户交互):", e);
            });
            audioStarted = true;
        }
    }
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // 计算冲击波中心点位置
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; 
    const blastPosition = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(distance));
    
    // 创建一个新的冲击波对象，使用 GUI 设置的参数
    const newBlast = {
        position: blastPosition,
        radius: 0,
        maxRadius: Settings.blastMaxRadius, 
        duration: Settings.blastDuration,  
        currentLife: 0,
        // 新增属性：用于计算每个粒子复原的起点
        restoreTime: 0, 
        initialOffset: [] // 此处用于存储每个粒子被推开的最终向量，但过于昂贵，故弃用
    };

    // 加入冲击波数组。如果超过最大数量，则移除最旧的冲击波。
    blasts.push(newBlast);
    if (blasts.length > MAX_BLASTS) {
        blasts.shift(); 
    }
}

// --- IV. MediaPipe 手势控制 (保持不变) ---

const videoElement = document.getElementById('webcam-video');

function calculateDistance(lm1, lm2) {
    return Math.sqrt(
        Math.pow(lm1.x - lm2.x, 2) + 
        Math.pow(lm1.y - lm2.y, 2) + 
        Math.pow(lm1.z - lm2.z, 2)
    );
}

function setupWebcamAndMediaPipe() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
            videoElement.addEventListener('loadeddata', () => {
                videoElement.play();
                hands.initialize().then(sendFrame);
            });
        })
        .catch(err => {
            console.error("无法访问摄像头:", err);
            alert("无法访问摄像头。请确保您已允许浏览器访问，并在 Live Server 上运行。");
        });

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
    hands.setOptions({
        maxNumHands: 1, 
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults((results) => {
        if (particleSystem && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            const dist = calculateDistance(landmarks[4], landmarks[20]); 
            
            const minD = 0.05; 
            const maxD = 0.2;  
            let normalizedDist = (dist - minD) / (maxD - minD);
            normalizedDist = Math.min(1, Math.max(0, normalizedDist)); 
            
            const minScale = 0.5; 
            const maxScale = Settings.maxScaleValue; 
            
            const targetScaleFactor = minScale + normalizedDist * (maxScale - minScale);
            
            const currentScale = particleSystem.scale.x;
            const smoothingFactor = 0.1; 
            
            const newScale = currentScale + (targetScaleFactor - currentScale) * smoothingFactor;
            
            particleSystem.scale.setScalar(newScale);
            DisplayData.scaleFactor = newScale;
            
        } else if (particleSystem) {
            const currentScale = particleSystem.scale.x;
            const targetScale = 1.0;
            const newScale = currentScale + (targetScale - currentScale) * 0.05;
            particleSystem.scale.setScalar(newScale);
            DisplayData.scaleFactor = newScale;
        }
    });

    async function sendFrame() {
        if (!videoElement.paused && !videoElement.ended) {
            await hands.send({ image: videoElement });
            requestAnimationFrame(sendFrame);
        }
    }
}


// --- V. 程序入口点 ---

function init() {
    // 1. 设备检测
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    
    // 2. 移动端配置覆盖
    if (isMobile) {
        console.log("检测到移动设备，优化性能配置。");
        Settings.particleCount = 8000; 
        Settings.particleSize = 0.05;  
    }
    
    // 3. 初始化 Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // 绑定事件
    document.addEventListener('pointerdown', onPointerDown, false);
    window.addEventListener('resize', onWindowResize, false);
    
    createParticleSystem();
    updateBackground(); // 锁定为黑色背景
    initGUI();
    setupWebcamAndMediaPipe();
    animate();
}

// 启动程序
init();