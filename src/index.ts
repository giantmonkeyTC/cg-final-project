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
//点光源
var point = new THREE.PointLight(0xffffff);
point.position.set(400, 200, 300); //点光源位置
scene.add(point); //点光源添加到场景中
//环境光
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);
// console.log(scene)
// console.log(scene.children)
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

var starsGeometry = new THREE.BufferGeometry();

// for (var i = 0; i < 10000; i++) {

//     var star = new THREE.Vector3();
//     star.x = THREE.MathUtils.randFloatSpread(2000);
//     star.y = THREE.MathUtils.randFloatSpread(2000);
//     star.z = THREE.MathUtils.randFloatSpread(2000);

//     var array = Array.from({ length: 3000 }, (x) => THREE.MathUtils.randFloatSpread(2000));
//     starsGeometry.setAttribute('position', new THREE.BufferAttribute(array, 3));

// }

var array = Int16Array.from({ length: 1200 }, (x) =>  THREE.MathUtils.randFloatSpread(100));
starsGeometry.setAttribute('position', new THREE.BufferAttribute(array, 3));
var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

var starField = new THREE.Points(starsGeometry, starsMaterial);

scene.add(starField);
// var group = new THREE.Group();
// for (let i = 0; i < 20; i++) {
//     // 创建精灵模型对象
//     var sprite = new THREE.Sprite();
//     scene.add(sprite);
//     // 控制精灵大小,
//     sprite.scale.set(8, 10, 1); //// 只需要设置x、y两个分量就可以
//     var k1 = Math.random() - 0.5;
//     var k2 = Math.random() - 0.5;
//     var k3 = Math.random() - 0.5;
//     // 设置精灵模型位置，在整个空间上上随机分布
//     sprite.position.set(200 * k1, 200 * k3, 200 * k2)
//     group.add(sprite);
// }

// scene.add(group);//雨滴群组插入场景中

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);//设置渲染区域尺寸
renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
//执行渲染操作   指定场景、相机作为参数
function render() {
    // group.children.forEach(sprite => {
    //     // 雨滴的y坐标每次减1
    //     sprite.position.y -= 1;
    //     if (sprite.position.y < 0) {
    //         // 如果雨滴落到地面，重置y，从新下落
    //         sprite.position.y = 200;
    //     }
    // });
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);
}
render();
var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件
