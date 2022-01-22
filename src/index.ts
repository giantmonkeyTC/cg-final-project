import * as THREE from "three"
import { BufferAttribute, Color, EventDispatcher, Material, Points } from "three"
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

//spring init
var springFlag = true;
const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  
	void main() {
    vUv = uv;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    
    float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );
    mvPosition.z += displacement;
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;
	}
`;

const fragmentShader = `
  varying vec2 vUv;
  
  void main() {
  	vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
    float clarity = ( vUv.y * 0.5 ) + 0.5;
    gl_FragColor = vec4( baseColor * clarity, 1 );
  }
`;

const uniforms = {
    time: {
        value: 0
    }
}

const leavesMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide
});

/////////
// 草地MESH
/////////

const instanceNumber = 250 * groundSize;
const dummy = new THREE.Object3D();

const geometry = new THREE.PlaneGeometry(0.1, 1, 1, 4);
geometry.translate(0, 0.5, 0); // move grass blade geometry lowest point at 0.

const instancedMesh = new THREE.InstancedMesh(geometry, leavesMaterial, instanceNumber);

const clock = new THREE.Clock();

//summer init
var rainGroupSummer = new THREE.Group();
var rainCount = 800;
var summerFlag = false;
var rainDropSpeed = 1.2;

//falll init
var fallFlag = false;


//winter init
var snowGroupWinter = new THREE.Group();
var pileGroupWinter = new THREE.Group();
const particleNumWinter = 1000;
const pileNumberWinter = 10000;
const velocitiesWinter = [];
var winterFlag = false;

winterInit();
summerInit();
springInit();

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

enum SeasonType {
    Spring,
    Summer,
    Fall,
    Winter
}
class SeasonEvent extends EventDispatcher {
    inform(season: SeasonType) {
        this.dispatchEvent({ type: 'season_update', seasonType: season });
    }
    next() {
        this.dispatchEvent({ type: 'season_next' });
    }
}

function winterInit() {

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


    for (let i = 0; i < particleNumWinter; i++) {
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
        snowGroupWinter.add(sprite);
    }

    for (let i = 0; i < pileNumberWinter; i++) {
        var spriteMaterial = new THREE.SpriteMaterial({
            map: getTexture(),
        })
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(Math.floor(Math.random() * maxRange - minRange),
            0,
            Math.floor(Math.random() * maxRange - minRange));
        scene.add(sprite);
        sprite.visible = false;
        pileGroupWinter.add(sprite);
    }

    for (let i = 0; i < particleNumWinter; i++) {
        const x = Math.floor(Math.random() * 6 - 3) * 0.1;
        const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
        const z = Math.floor(Math.random() * 6 - 3) * 0.1;
        const particle = new THREE.Vector3(x, y, z);
        velocitiesWinter.push(particle);
    }
    scene.add(snowGroupWinter);
    scene.add(pileGroupWinter);
}

function winterShow() {
    winterFlag = true;
    snowGroupWinter.visible = true;
    pileGroupWinter.visible = true;
    pileGroupWinter.children.forEach(it => { it.visible = false; })

}

function summerInit() {
    // 创建一个组表示所有的雨滴

    const texloader = new THREE.TextureLoader();// 加载雨滴理贴图
    texloader.load(
        '/raindrop.png',
        function (textureTree) {
            console.log("raindrop loaded");
            // 批量创建表示雨滴的精灵模型
            for (let i = 0; i < rainCount; i++) {
                var spriteMaterial = new THREE.SpriteMaterial({
                    map: textureTree,//设置精灵纹理贴图
                });
                // 创建精灵模型对象
                var sprite = new THREE.Sprite(spriteMaterial);
                scene.add(sprite);
                // 控制精灵大小,
                sprite.scale.set(.3, .6, 1);  //只需要设置x、y两个分量就可以
                //set position
                // var k1 = Math.random() - 0.5;
                // var k2 = Math.random() - 0.5;
                // var k3 = Math.random() ;
                // 设置精灵模型位置，在整个空间上上随机分布
                // sprite.position.set(100 * k1, sky*k3, 100 * k2);
                sprite.position.set(Math.floor(Math.random() * maxRange - minRange),
                    Math.floor(Math.random() * maxRange - minRange),
                    Math.floor(Math.random() * maxRange - minRange));
                rainGroupSummer.add(sprite);
            }
            scene.add(rainGroupSummer);//雨滴群组插入场景中

        },
        function (error) { console.error("rain texture failed to load:", error) }
    );
}
function summerShow() {
    summerFlag = true;
    rainGroupSummer.visible = true;
}
function springInit() {
    scene.add(instancedMesh);

    for (let i = 0; i < instanceNumber; i++) {

        dummy.position.set(
            (Math.random() - 0.5) * groundSize,
            0,
            (Math.random() - 0.5) * groundSize
        );

        dummy.scale.setScalar(0.5 + Math.random() * 0.5);

        dummy.rotation.y = Math.random() * Math.PI;

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

    }
}
function springShow() {
    springFlag = true;
    instancedMesh.visible = true;
}
function seasonDisable() {
    springFlag = false;
    summerFlag = false;
    fallFlag = false;
    winterFlag = false;
    snowGroupWinter.visible = false;
    pileGroupWinter.visible = false;
    rainGroupSummer.visible = false;
    instancedMesh.visible = false;
}

class BirdGeometry extends THREE.BufferGeometry {

    constructor() {

        super();

        const trianglesPerBird = 3;
        const triangles = BIRDS * trianglesPerBird;
        const points = triangles * 3;

        const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
        const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
        const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
        const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);

        this.setAttribute('position', vertices);
        this.setAttribute('birdColor', birdColors);
        this.setAttribute('reference', references);
        this.setAttribute('birdVertex', birdVertex);

        // this.setAttribute( 'normal', new Float32Array( points * 3 ), 3 );


        let v = 0;
        function verts_push(vert: number, ...restofVert: number[]) {

            for (let i = 0; i < arguments.length; i++) {

                (vertices.array as Float32Array)[v++] = arguments[i];

            }

        }

        const wingsSpan = 20;

        for (let f = 0; f < BIRDS; f++) {

            // Body

            verts_push(
                0, - 0, - 20,
                0, 4, - 20,
                0, 0, 30
            );

            // Wings

            verts_push(
                0, 0, - 15,
                - wingsSpan, 0, 0,
                0, 0, 15
            );

            verts_push(
                0, 0, 15,
                wingsSpan, 0, 0,
                0, 0, - 15
            );

        }

        for (let v = 0; v < triangles * 3; v++) {

            const triangleIndex = ~ ~(v / 3);
            const birdIndex = ~ ~(triangleIndex / trianglesPerBird);
            const x = (birdIndex % WIDTH) / WIDTH;
            const y = ~ ~(birdIndex / WIDTH) / WIDTH;

            const c = new THREE.Color(
                0x444444 +
                ~ ~(v / 9) / BIRDS * 0x666666
            );

            (birdColors.array as Float32Array)[v * 3 + 0] = c.r;
            (birdColors.array as Float32Array)[v * 3 + 1] = c.g;
            (birdColors.array as Float32Array)[v * 3 + 2] = c.b;

            (references.array as Float32Array)[v * 2] = x;
            (references.array as Float32Array)[v * 2 + 1] = y;

            (birdVertex.array as Float32Array)[v] = v % 9;

        }

        this.scale(0.2, 0.2, 0.2);

    }

}
const birdVertexShader = `
attribute vec2 reference;
attribute float birdVertex;

attribute vec3 birdColor;

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

varying vec4 vColor;
varying float z;

uniform float time;

void main() {

    vec4 tmpPos = texture2D( texturePosition, reference );
    vec3 pos = tmpPos.xyz;
    vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

    vec3 newPosition = position;

    newPosition = mat3( modelMatrix ) * newPosition;


    velocity.z *= -1.;
    float xz = length( velocity.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velocity.y * velocity.y );

    float cosry = velocity.x / xz;
    float sinry = velocity.z / xz;

    float cosrz = x / xyz;
    float sinrz = velocity.y / xyz;

    mat3 maty =  mat3(
        cosry, 0, -sinry,
        0    , 1, 0     ,
        sinry, 0, cosry

    );

    mat3 matz =  mat3(
        cosrz , sinrz, 0,
        -sinrz, cosrz, 0,
        0     , 0    , 1
    );

    newPosition =  maty * matz * newPosition;
    newPosition += pos;

    z = newPosition.z;

    vColor = vec4( birdColor, 1.0 );
    gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
}
`;
const birdFragmentShader = `
varying vec4 vColor;
			varying float z;

			uniform vec3 color;

			void main() {
				// Fake colors for now
				float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
				gl_FragColor = vec4( z2, z2, z2, 1. );

			}
`;

let birdUniforms;

const birdGeometry = new BirdGeometry();

// For Vertex and Fragment
birdUniforms = {
    'color': { value: new THREE.Color(0xff2200) },
    'texturePosition': { value: null },
    'textureVelocity': { value: null },
    'time': { value: 1.0 },
    'delta': { value: 0.0 }
};

// THREE.ShaderMaterial
const birdMaterial = new THREE.ShaderMaterial({
    uniforms: birdUniforms,
    vertexShader: birdVertexShader,
    fragmentShader: birdFragmentShader,
    side: THREE.DoubleSide
});

const birdMesh = new THREE.Mesh(birdGeometry, birdMaterial);
birdMesh.rotation.y = Math.PI / 2;
birdMesh.matrixAutoUpdate = false;
birdMesh.updateMatrix();

scene.add(birdMesh);




class PileEvent extends EventDispatcher {
    pile(pileX, pileZ) {
        this.dispatchEvent({ type: 'pile', x: pileX, z: pileZ });
    }
};


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
const pileListener = new PileEvent();
const seasonListener = new SeasonEvent();
var index = 0;
pileListener.addEventListener('pile', function (event) {
    pileGroupWinter.children.at(index).visible = true;
    pileGroupWinter.children.at(index).position.set(event.x, 0., event.z);
    index++;
    if (index >= pileNumberWinter)
        index = 0;
    if (index >= pileNumberWinter / 2)
        pileGroupWinter.children.at(index + 1 - Math.floor(pileNumberWinter / 2)).visible = false;
});
seasonListener.addEventListener('season_update', function (event) {
    seasonDisable();
    if (event.seasonType == SeasonType.Spring)
        springShow();
    else if (event.seasonType == SeasonType.Summer)
        summerShow();
    else if (event.seasonType == SeasonType.Fall)
        fallShow();
    else if (event.seasonType == SeasonType.Winter)
        winterShow();
});
seasonListener.addEventListener('season_next', function (event) {
    if (springFlag)
        seasonListener.inform(SeasonType.Summer);
    else if (summerFlag)
        seasonListener.inform(SeasonType.Fall);
    else if (fallFlag)
        seasonListener.inform(SeasonType.Winter);
    else if (winterFlag)
        seasonListener.inform(SeasonType.Spring);

});
var start = 0;
function render() {
    const time = Date.now() * 0.001;
    // if (time - start >= 5) {
    //     start = time;
    //     seasonListener.next();
    // }
    seasonListener.inform(SeasonType.Fall);
    if (summerFlag) {
        rainGroupSummer.children.forEach(sprite => {
            // 雨滴的y坐标每次减1
            sprite.position.y -= rainDropSpeed;
            if (sprite.position.y < 0) {
                // 如果雨滴落到地面，重置y，重新下落
                sprite.position.y += sky;
            }
        });
    }

    birdMaterial.uniformsNeedUpdate = true;

    if (springFlag) {
        leavesMaterial.uniforms.time.value = clock.getElapsedTime();
        leavesMaterial.uniformsNeedUpdate = true;
    }

    if (winterFlag)
        snowGroupWinter.children.forEach((sprite, i) => {
            sprite.position.y += velocitiesWinter[i].y;
            sprite.position.x += velocitiesWinter[i].x;
            sprite.position.z += velocitiesWinter[i].z;
            if (sprite.position.y < -5) {
                sprite.position.y += maxRange;
                pileListener.pile(sprite.position.x, sprite.position.z);
            }
            if (sprite.position.x > maxRange) {
                sprite.position.x -= (maxRange + Math.random() * 10);
            }
            else if (sprite.position.x < -maxRange) {
                sprite.position.x += (maxRange + Math.random() * 10);
            }
            if (sprite.position.z > maxRange) {
                sprite.position.z -= (maxRange + Math.random() * 10);
            }
            else if (sprite.position.z < -maxRange) {
                sprite.position.z += (maxRange + Math.random() * 10);
            }
        });
    renderer.render(scene, camera); //执行渲染操作
    requestAnimationFrame(render);//请求再次执行渲染函数render，渲染下一帧

}
requestAnimationFrame(render);


function fallShow() {
    fallFlag = true;
    console.log('fall');
}



var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件