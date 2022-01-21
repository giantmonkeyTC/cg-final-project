import * as THREE from "three"
import { BufferAttribute, Color, Points } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as CONTROL from "three/examples/jsm/controls/OrbitControls.js"
import { time, timeStamp } from "console";

/**
     * 创建场景对象Scene
     */
var scene = new THREE.Scene();
/**
 * 光源设置
 */
var point = new THREE.PointLight(0xffffff);
var sky = 30;
point.position.set(60, 0, 10); //点光源位置
point.power = 10.
point.intensity = 10.
scene.add(point); //点光源添加到场景中
var ambient = new THREE.AmbientLight(0xffffff);
ambient.intensity = 10.
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
camera.position.z = -30;
camera.position.x = 0;
camera.position.y = 10;
camera.rotation.y = 3.14;


let particles: Points;

const particleNum = 1000;
const maxRange = 200;
const minRange = maxRange / 2;
const textureSize = 64.0;



const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
    ctx.save();
    const gradient = ctx.createRadialGradient(canvasRadius, canvasRadius, 0, canvasRadius, canvasRadius, canvasRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
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

// 创建一个组表示所有的雨滴
var group = new THREE.Group();

// 加载雨滴理贴图
const texloader = new THREE.TextureLoader();


for (let i = 0; i < 1000; i++) {
    var spriteMaterial = new THREE.SpriteMaterial({
        map: getTexture(),//设置精灵纹理贴图
    });
    // 创建精灵模型对象
    var sprite = new THREE.Sprite(spriteMaterial);
    scene.add(sprite);
    // 控制精灵大小,
    sprite.scale.set(.8, .8, 5);  //只需要设置x、y两个分量就可以
    var k1 = Math.random() - 0.5;
    var k2 = Math.random() - 0.5;
    var k3 = Math.random();
    // 设置精灵模型位置，在整个空间上上随机分布
    sprite.position.set( Math.floor(Math.random() * maxRange - minRange), 
     Math.floor(Math.random() * maxRange - minRange),
     Math.floor(Math.random() * maxRange - minRange));
    group.add(sprite);
}
scene.add(group);//雨滴群组插入场景中




let geometry = new THREE.BufferGeometry()
let positions = [];
let colors = [];
for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * maxRange - minRange);
    const y = Math.floor(Math.random() * maxRange - minRange);
    const z = Math.floor(Math.random() * maxRange - minRange);
    positions.push(x, y, z);
    colors.push(255., 255., 255.);
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
// geometry.computeBoundingSphere();

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

// const velocities = [];
// for (let i = 0; i < particleNum; i++) {
//     const x = Math.floor(Math.random() * 6 - 3) * 0.1;
//     const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
//     const z = Math.floor(Math.random() * 6 - 3) * 0.1;
//     const particle = new THREE.Vector3(x, y, z);
//     velocities.push(particle);
// }


let pile = [];



var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);//设置渲染区域尺寸
renderer.setClearColor(0x627494, 1); //设置背景颜色  原来 0xb9d3f
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

function render() {
    const time = Date.now() * 0.001;

    group.children.forEach(sprite => {
        // 雨滴的y坐标每次减1
        sprite.position.y -= .8;
        if (sprite.position.y < 0) {
          // 如果雨滴落到地面，重置y，从新下落
          sprite.position.y += maxRange;
        }
      });
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧

}
requestAnimationFrame(render);

// var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
// controls.addEventListener('change', render);//监听鼠标、键盘事件