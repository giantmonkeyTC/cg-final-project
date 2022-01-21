import * as THREE from "three"
import { BufferAttribute, Color, EventDispatcher, Points } from "three"
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
loader.load('/scene.gltf', function (gltf) {
    gltf.scene.scale.set(0.05, 0.05, 0.05);
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
})
scene.background = new THREE.Color(0x000000);
camera.position.z = -30;
camera.position.x = 0;
camera.position.y = 10;
camera.rotation.y = 3.14;

const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshPhongMaterial({ color: 0x000000, depthWrite: false }));
ground.rotation.x = - Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

const particleNum = 1000;
const pileNumber = 10000;
const maxRange = 100;
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
    drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);
    const texture = new THREE.Texture(canvas);
    texture.type = THREE.FloatType;
    texture.needsUpdate = true;
    return texture;
}

var snowGroup = new THREE.Group();
var pileGroup = new THREE.Group();

for (let i = 0; i < particleNum; i++) {
    var spriteMaterial = new THREE.SpriteMaterial({
        map: getTexture(),
        fog: true,
        transparent: true,
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    scene.add(sprite);
    sprite.scale.set(.8, .8, 5);
    sprite.position.set(Math.floor(Math.random() * maxRange - minRange),
        Math.floor(Math.random() * maxRange - minRange),
        Math.floor(Math.random() * maxRange - minRange));
    snowGroup.add(sprite);
}

for (let i = 0; i < pileNumber; i++) {
    var spriteMaterial = new THREE.SpriteMaterial({
        map: getTexture(),
    })
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(Math.floor(Math.random() * maxRange - minRange),
        0,
        Math.floor(Math.random() * maxRange - minRange));
    scene.add(sprite);
    sprite.visible = false;
    pileGroup.add(sprite);
}


scene.add(snowGroup);
scene.add(pileGroup);


// let geometry = new THREE.BufferGeometry()
// let positions = [];
// let colors = [];
// for (let i = 0; i < particleNum; i++) {
//     const x = Math.floor(Math.random() * maxRange - minRange);
//     const y = Math.floor(Math.random() * maxRange - minRange);
//     const z = Math.floor(Math.random() * maxRange - minRange);
//     positions.push(x, y, z);
//     colors.push(255., 255., 255.);
// }
// geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const velocities = [];
for (let i = 0; i < particleNum; i++) {
    const x = Math.floor(Math.random() * 6 - 3) * 0.1;
    const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
    const z = Math.floor(Math.random() * 6 - 3) * 0.1;
    const particle = new THREE.Vector3(x, y, z);
    velocities.push(particle);
}


class PileEvent extends EventDispatcher {
    pile(pileX, pileZ) {
        this.dispatchEvent({ type: 'pile', x: pileX, z: pileZ });
    }
};
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);//设置渲染区域尺寸
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
const pileEvent = new PileEvent();
var index = 0;
pileEvent.addEventListener('pile',function(event){
    pileGroup.children.at(index).visible = true;
    pileGroup.children.at(index).position.set(event.x,1.,event.z);
    index++;
    if(index>=pileNumber)
        index=0;
    if(index>=pileNumber/2)
        pileGroup.children.at(index + 1 - Math.floor(pileNumber/2)).visible = false;
});

function render() {
    const time = Date.now() * 0.001;

    snowGroup.children.forEach((sprite, i) => {
        sprite.position.y += velocities[i].y;
        sprite.position.x += velocities[i].x;
        sprite.position.z += velocities[i].z;
        if (sprite.position.y < -5) {
            sprite.position.y += maxRange;
             pileEvent.pile(sprite.position.x,sprite.position.z);
        }
        if (sprite.position.x > maxRange) {
            sprite.position.x -= (maxRange + Math.random()*10);
        }
        else if (sprite.position.x < -maxRange) {
            sprite.position.x += (maxRange + Math.random()*10);
        }
        if (sprite.position.z > maxRange) {
            sprite.position.z -=(maxRange + Math.random()*10);
        }
        else if (sprite.position.z < -maxRange) {
            sprite.position.z += (maxRange + Math.random()*10);
        }
    });
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧

}
requestAnimationFrame(render);

// var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
// controls.addEventListener('change', render);//监听鼠标、键盘事件