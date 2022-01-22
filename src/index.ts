import * as THREE from "three"
import { BufferAttribute, BufferGeometry, Color, EventDispatcher, Mesh, MeshBasicMaterial, Points } from "three"
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
var groundSize = 30
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
loader.load('/scene.gltf', function (gltf) {
    gltf.scene.scale.set(0.05, 0.05, 0.05);
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
})
const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 32;

const WIDTH = 32;
const BIRDS = WIDTH * WIDTH;

const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 0, 24);
gradient.addColorStop(0.0, '#014a84');
gradient.addColorStop(0.4, '#0561a0');
gradient.addColorStop(0.8, '#ffffff');
context.fillStyle = gradient;
context.fillRect(0, 0, 1, 24);

const background = new THREE.Mesh(
    new THREE.SphereGeometry(150),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.BackSide })
);
scene.add(background);
camera.position.z = -30;
camera.position.x = 0;
camera.position.y = 10;
camera.rotation.y = 3.14;

const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), new THREE.MeshPhongMaterial({ color: 0x000000, depthWrite: false }));
ground.rotation.x = - Math.PI / 2;
ground.position.y = 0;
scene.add(ground);


const maxRange = 100;
const minRange = maxRange / 2;

var Bird = function () {

    const bodyvertex = [0, - 0, - 20,
        0, 4, - 20,
        0, 0, 30]

    const winglvertex = [
        0, 0, - 15,
        - 40, 0, 0,
        0, 0, 15
    ]
    const wingrvertex = [
        0, 0, 15,
        40, 0, 0,
        0, 0, - 15
    ]
    this.birdgeometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
        0, - 0, - 20,
        0, 8, - 20,
        0, 0, 30,

        0, 0, - 15,
        - 40, 0, 0,
        0, 0, 15,

        0, 0, 15,
        40, 0, 0,
        0, 0, - 15
    ])

    this.mesh = new THREE.Object3D();

    this.birdgeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.birdmesh = new THREE.Mesh(this.birdgeometry, material);
    this.mesh.add(this.birdmesh);
};

var bird;
function createPlane() {
    for(let i =0;i<10;i++){
    }
    bird = new Bird();
    bird.mesh.scale.set(.25, .25, .25);
    bird.mesh.position.y = 10;
    scene.add(bird.mesh);
}
createPlane();


// disabling AA (antialiasing) to increase performance on macs with retina displays
// https://attackingpixels.com/tips-tricks-optimizing-three-js-performance/
let pixelRatio = window.devicePixelRatio
let AA = true
if (pixelRatio > 1) {
    AA = false
}
var renderer = new THREE.WebGLRenderer({
    antialias: AA,
    powerPreference: "high-performance",
});
renderer.setSize(width, height);//设置渲染区域尺寸
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

renderer.render(scene, camera);
var start = 0;
var flag = true;
function render() {
    const time = Date.now() * 0.001;
    if (time - start >= 0.3) {
        start = time;
        if (flag) {
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setX(4, -35);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setY(4, 15);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setX(7, 35);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setY(7, 15);
            console.log((bird.birdgeometry as BufferGeometry).getAttribute('position').getX(5));
           (bird.birdgeometry as BufferGeometry).attributes.position.needsUpdate = true;
            flag = false;
        }
        else if(!flag) {
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setX(4, -35);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setY(4, -15);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setX(7, 35);
            (bird.birdgeometry as BufferGeometry).getAttribute('position').setY(7, -15);
            console.log((bird.birdgeometry as BufferGeometry).getAttribute('position').getX(5));
            flag = true;
            (bird.birdgeometry as BufferGeometry).attributes.position.needsUpdate = true;
        }

    }
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧

}
requestAnimationFrame(render);


var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件