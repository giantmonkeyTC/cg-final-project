import * as THREE from "three"
import { Color } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as CONTROL from "three/examples/jsm/controls/OrbitControls.js"

/**
     * 创建场景对象Scene
     */
var scene = new THREE.Scene();
/**
 * 光源设置
 */
var point = new THREE.PointLight(0xff0000);
var sky = 30;
point.position.set(0, 300, 0); //点光源位置
scene.add(point); //点光源添加到场景中
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);
/**
 * 相机设置
 */
var width = window.innerWidth; //窗口宽度
var height = window.innerHeight; //窗口高度
//创建相机对象
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
/**
 * 创建渲染器对象
 */
const loader = new GLTFLoader();
loader.load('/sceneconverttest.gltf', function (gltf) {
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
})
camera.position.z = 2;
camera.position.x = 5;
camera.position.y = 5;

// var starsGeometry = new THREE.BufferGeometry();

// var array = Int16Array.from({ length: 300 }, (x) =>  THREE.MathUtils.randFloatSpread(100));
// starsGeometry.setAttribute('position', new THREE.BufferAttribute(array,3));
// var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

// var starField = new THREE.Points(starsGeometry, starsMaterial);

// scene.add(starField);

let particles;

const particleNum = 10000;
const maxRange = 1000;
const minRange = maxRange / 2;
const textureSize = 64.0;



const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
    ctx.save();
    const gradient = ctx.createRadialGradient(canvasRadius,canvasRadius,0,canvasRadius,canvasRadius,canvasRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvasW,canvasH);
    ctx.restore();
}

const getTexture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const diameter = textureSize;
    canvas.width = diameter;
    canvas.height = diameter;
    const canvasRadius = diameter / 2;

    /* gradation circle
    ------------------------ */
    drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);
    
    /* snow crystal
    ------------------------ */
    // drawSnowCrystal(ctx, canvasRadius);

    const texture = new THREE.Texture(canvas);
    //texture.minFilter = THREE.NearestFilter;
    texture.type = THREE.FloatType;
    texture.needsUpdate = true;
    return texture;
}



let geometry = new THREE.BufferGeometry()
let positions = [];
let colors = [];
for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * maxRange - minRange);
    const y = Math.floor(Math.random() * maxRange - minRange);
    const z = Math.floor(Math.random() * maxRange - minRange);
   positions.push(x,y,z)
   colors.push(255.,255.,255.)
}
geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
geometry.computeBoundingSphere();

const pointMaterial = new THREE.PointsMaterial({
    size: 8,
    color: 0xffffff,
    vertexColors: false,
    map: getTexture(),
    // blending: THREE.AdditiveBlending,
    transparent: true,
    // opacity: 0.8,
    fog: true,
    depthWrite: false
});

const velocities = [];
for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * 6 - 3) * 0.1;
    const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
    const z = Math.floor(Math.random() * 6 - 3) * 0.1;
    const particle = new THREE.Vector3(x, y, z);
    velocities.push(particle);
}

particles = new THREE.Points(geometry, pointMaterial);
particles.geometry.velocities = velocities;
scene.add(particles);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);//设置渲染区域尺寸
renderer.setClearColor(0x627494, 1); //设置背景颜色  原来 0xb9d3f
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
//执行渲染操作   指定场景、相机作为参数
// 渲染函数
function render() {
    // // 每次渲染遍历雨滴群组，刷新频率30~60FPS，两帧时间间隔16.67ms~33.33ms
    // // 每次渲染都会更新雨滴的位置，进而产生动画效果
    // group.children.forEach(sprite => {
    //   // 雨滴的y坐标每次减1
    //   sprite.position.y -= .8;
    //   if (sprite.position.y < 0) {
    //     // 如果雨滴落到地面，重置y，从新下落
    //     sprite.position.y += sky;
    //   }
    // });


    const posArr = particles.geometry.vertices;
    const velArr = particles.geometry.velocities;

    // posArr.forEach((vertex, i) => {
    //     const velocity = velArr[i];

    //     const x = i * 3;
    //     const y = i * 3 + 1;
    //     const z = i * 3 + 2;
        
    //     // const velX = Math.sin(timeStamp * 0.001 * velocity.x) * 0.1;
    //     // const velZ = Math.cos(timeStamp * 0.0015 * velocity.z) * 0.1;
        
    //     // vertex.x += velX;
    //     // vertex.y += velocity.y;
    //     // vertex.z += velZ;

    //     if (vertex.y < -minRange ) {
    //         vertex.y = minRange;
    //     }

    // })

    particles.geometry.verticesNeedUpdate = true;


    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧
  }
  
render();
var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件
