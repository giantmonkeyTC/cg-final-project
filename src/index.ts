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
var point = new THREE.PointLight(0xff0000);
var sky = 30;
point.position.set(0, 300, 0); //点光源位置
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

// var starsGeometry = new THREE.BufferGeometry();

// var array = Int16Array.from({ length: 300 }, (x) =>  THREE.MathUtils.randFloatSpread(100));
// starsGeometry.setAttribute('position', new THREE.BufferAttribute(array,3));
// var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });

// var starField = new THREE.Points(starsGeometry, starsMaterial);

// scene.add(starField);
// // 雨滴对象
/**
 * 精灵创建下雨效果
 */
// 创建一个组表示所有的雨滴
var group = new THREE.Group();

// 加载雨滴理贴图
const texloader = new THREE.TextureLoader();

texloader.load(
    '/snowflake1.png',
    function(textureTree){
        console.log("raindrop loaded");
        // 批量创建表示雨滴的精灵模型
        for (let i = 0; i < 100; i++) {
            var spriteMaterial = new THREE.SpriteMaterial({
            map:textureTree,//设置精灵纹理贴图
            });
            // 创建精灵模型对象
            var sprite = new THREE.Sprite(spriteMaterial);
            scene.add(sprite);
            // 控制精灵大小,
            sprite.scale.set(.3, .6, 1);  //只需要设置x、y两个分量就可以
            var k1 = Math.random() - 0.5;
            var k2 = Math.random() - 0.5;
            var k3 = Math.random() ;
            // 设置精灵模型位置，在整个空间上上随机分布
            sprite.position.set(100 * k1, sky*k3, 100 * k2);
            group.add(sprite);
        }
        scene.add(group);//雨滴群组插入场景中

    },
    function(error){console.error("rain texture failed to load:",error)}
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);//设置渲染区域尺寸
renderer.setClearColor(0x627494, 1); //设置背景颜色  原来 0xb9d3f
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
//执行渲染操作   指定场景、相机作为参数
// 渲染函数
function render() {
    // 每次渲染遍历雨滴群组，刷新频率30~60FPS，两帧时间间隔16.67ms~33.33ms
    // 每次渲染都会更新雨滴的位置，进而产生动画效果
    group.children.forEach(sprite => {
      // 雨滴的y坐标每次减1
      sprite.position.y -= .8;
      if (sprite.position.y < 0) {
        // 如果雨滴落到地面，重置y，从新下落
        sprite.position.y += sky;
      }
    });
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧
  }
  
render();
var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件
