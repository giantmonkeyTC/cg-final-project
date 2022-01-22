"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var THREE = require("three");
var three_1 = require("three");
var GLTFLoader_js_1 = require("three/examples/jsm/loaders/GLTFLoader.js");
var dat_gui_1 = require("dat.gui");
/**
     * 创建场景对象Scene
     */
var scene = new THREE.Scene();
/**
 * 光源设置
 */
var point = new THREE.PointLight(0xffffff);
var sky = 30;
var groundSize = 30;
point.position.set(60, 0, 10); //点光源位置
point.power = 10.;
point.intensity = 3.;
scene.add(point); //点光源添加到场景中
var ambient = new THREE.AmbientLight(0xffffff);
ambient.intensity = 5;
scene.add(ambient);
var directional = new THREE.DirectionalLight(0xffffff);
directional.intensity = 3;
directional.position.set(-100, 0, 0);
scene.add(directional);
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
var loader = new GLTFLoader_js_1.GLTFLoader();
loader.load('/scene.gltf', function (gltf) {
    gltf.scene.scale.set(0.05, 0.05, 0.05);
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});
var canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 32;
var context = canvas.getContext('2d');
var gradient = context.createLinearGradient(0, 0, 0, 24);
gradient.addColorStop(0.0, '#014a84');
gradient.addColorStop(0.4, '#0561a0');
gradient.addColorStop(0.8, '#ffffff');
context.fillStyle = gradient;
context.fillRect(0, 0, 1, 24);
var rotationSetting = true;
//gui
var gui = new dat_gui_1.GUI();
var controls = new function () {
    this.spring = function () {
        seasonListener.inform(SeasonType.Spring);
        rotationSetting = false;
    };
    this.summer = function () {
        seasonListener.inform(SeasonType.Summer);
        rotationSetting = false;
    };
    this.fall = function () {
        seasonListener.inform(SeasonType.Fall);
        rotationSetting = false;
    };
    this.winter = function () {
        seasonListener.inform(SeasonType.Winter);
        rotationSetting = false;
    };
    this.startRotation = function () {
        rotationSetting = true;
    };
};
gui.add(controls, 'spring');
gui.add(controls, 'summer');
gui.add(controls, 'fall');
gui.add(controls, 'winter');
gui.add(controls, 'startRotation');
var background = new THREE.Mesh(new THREE.SphereGeometry(150), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.BackSide }));
scene.add(background);
camera.position.z = -30;
camera.position.x = 0;
camera.position.y = 10;
camera.rotation.y = 3.14;
var ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), new THREE.MeshPhongMaterial({ color: 0x000000, depthWrite: false }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
// scene.add(ground);
var maxRange = 100;
var minRange = maxRange / 2;
//sound init
var springMusic = "music/spring.mp3";
var fallMusic = "music/fall.mp3";
var summerMusic = "music/summer.mp3";
var winterMusic = "music/winter.mp3";
// var musicList=[springMusic,summerMusic,fallMusic,winterMusic];
var audioLoader = new THREE.AudioLoader();
var listener = new THREE.AudioListener();
var audio = new THREE.Audio(listener);
//spring init
var springFlag = true;
var vertexShader = "\n  varying vec2 vUv;\n  uniform float time;\n  \n\tvoid main() {\n    vUv = uv;\n    \n    // VERTEX POSITION\n    \n    vec4 mvPosition = vec4( position, 1.0 );\n    #ifdef USE_INSTANCING\n    \tmvPosition = instanceMatrix * mvPosition;\n    #endif\n    \n    // DISPLACEMENT\n    \n    // here the displacement is made stronger on the blades tips.\n    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );\n    \n    float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );\n    mvPosition.z += displacement;\n    \n    //\n    \n    vec4 modelViewPosition = modelViewMatrix * mvPosition;\n    gl_Position = projectionMatrix * modelViewPosition;\n\t}\n";
var fragmentShader = "\n  varying vec2 vUv;\n  \n  void main() {\n  \tvec3 baseColor = vec3( 0.41, 1.0, 0.5 );\n    float clarity = ( vUv.y * 0.5 ) + 0.5;\n    gl_FragColor = vec4( baseColor * clarity, 1 );\n  }\n";
var uniforms = {
    time: {
        value: 0
    }
};
var leavesMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    side: THREE.DoubleSide
});
/////////
// 草地MESH
/////////
var instanceNumber = 250 * groundSize;
var dummy = new THREE.Object3D();
var geometry = new THREE.PlaneGeometry(0.1, 1, 1, 4);
geometry.translate(0, 0.5, 0); // move grass blade geometry lowest point at 0.
var instancedMesh = new THREE.InstancedMesh(geometry, leavesMaterial, instanceNumber);
var clock = new THREE.Clock();
//summer init
var rainGroupSummer = new THREE.Group();
var rainCount = 800;
var summerFlag = false;
var rainDropSpeed = 1.2;
//falll init
var fallFlag = false;
var Bird = function () {
    this.birdgeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
        0, -0, 0,
        0, 8, 0,
        0, 0, 30,
        0, 0, -15,
        -40, 0, 0,
        0, 0, 15,
        0, 0, 15,
        40, 0, 0,
        0, 0, -15
    ]);
    this.mesh = new THREE.Object3D();
    this.birdgeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.birdmesh = new THREE.Mesh(this.birdgeometry, material);
    this.mesh.add(this.birdmesh);
};
var birds = [];
for (var i = 0; i < 30; i++) {
    var bird = new Bird();
    bird.mesh.scale.set(.05, .05, .05);
    bird.mesh.position.x = 3 * i;
    bird.mesh.rotation.y = 3.14 / 2;
    if (i > 10 && i <= 20) {
        bird.mesh.position.y = 15;
    }
    else if (i > 20) {
        bird.mesh.position.y = 10;
    }
    else {
        bird.mesh.position.y = 20;
    }
    birds.push(bird);
    scene.add(bird.mesh);
}
//winter init
var snowGroupWinter = new THREE.Group();
var pileGroupWinter = new THREE.Group();
var particleNumWinter = 1000;
var pileNumberWinter = 10000;
var velocitiesWinter = [];
var winterFlag = false;
//cover init
var cover = new THREE.IcosahedronGeometry(60);
var coverMaterial = new THREE.MeshPhongMaterial({ color: new three_1.Color(0xffff66), side: THREE.DoubleSide });
var plane = new THREE.Mesh(cover, coverMaterial);
plane.position.z = 100;
ground.rotation.y = -Math.PI / 2;
scene.add(plane);
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
var SeasonType;
(function (SeasonType) {
    SeasonType[SeasonType["Spring"] = 0] = "Spring";
    SeasonType[SeasonType["Summer"] = 1] = "Summer";
    SeasonType[SeasonType["Fall"] = 2] = "Fall";
    SeasonType[SeasonType["Winter"] = 3] = "Winter";
})(SeasonType || (SeasonType = {}));
var SeasonEvent = /** @class */ (function (_super) {
    __extends(SeasonEvent, _super);
    function SeasonEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SeasonEvent.prototype.inform = function (season) {
        this.dispatchEvent({ type: 'season_update', seasonType: season });
    };
    SeasonEvent.prototype.next = function () {
        this.dispatchEvent({ type: 'season_next' });
    };
    return SeasonEvent;
}(three_1.EventDispatcher));
function winterInit() {
    var textureSize = 64.0;
    var drawRadialGradation = function (ctx, canvasRadius, canvasW, canvasH) {
        ctx.save();
        var gradient = ctx.createRadialGradient(canvasRadius, canvasRadius, 0, canvasRadius, canvasRadius, canvasRadius);
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.restore();
    };
    var getTexture = function () {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var diameter = textureSize;
        canvas.width = diameter;
        canvas.height = diameter;
        var canvasRadius = diameter / 2;
        drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);
        var texture = new THREE.Texture(canvas);
        texture.type = THREE.FloatType;
        texture.needsUpdate = true;
        return texture;
    };
    for (var i = 0; i < particleNumWinter; i++) {
        var spriteMaterial = new THREE.SpriteMaterial({
            map: getTexture(),
            fog: true,
            transparent: true
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        scene.add(sprite);
        sprite.scale.set(.8, .8, 5);
        sprite.position.set(Math.floor(Math.random() * maxRange - minRange), Math.floor(Math.random() * maxRange - minRange), Math.floor(Math.random() * maxRange - minRange));
        snowGroupWinter.add(sprite);
    }
    for (var i = 0; i < pileNumberWinter; i++) {
        var spriteMaterial = new THREE.SpriteMaterial({
            map: getTexture()
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(Math.floor(Math.random() * maxRange - minRange), 0, Math.floor(Math.random() * maxRange - minRange));
        scene.add(sprite);
        sprite.visible = false;
        pileGroupWinter.add(sprite);
    }
    for (var i = 0; i < particleNumWinter; i++) {
        var x = Math.floor(Math.random() * 6 - 3) * 0.1;
        var y = Math.floor(Math.random() * 10 + 3) * -0.05;
        var z = Math.floor(Math.random() * 6 - 3) * 0.1;
        var particle = new THREE.Vector3(x, y, z);
        velocitiesWinter.push(particle);
    }
    scene.add(snowGroupWinter);
    scene.add(pileGroupWinter);
}
function winterShow() {
    winterFlag = true;
    snowGroupWinter.visible = true;
    setLight(new three_1.Color(0x0000ff));
    pileGroupWinter.visible = true;
    pileGroupWinter.children.forEach(function (it) { it.visible = false; });
    audioLoader.load(winterMusic, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });
}
function summerInit() {
    // 创建一个组表示所有的雨滴
    var texloader = new THREE.TextureLoader(); // 加载雨滴理贴图
    texloader.load('/raindrop.png', function (textureTree) {
        console.log("raindrop loaded");
        // 批量创建表示雨滴的精灵模型
        for (var i = 0; i < rainCount; i++) {
            var spriteMaterial = new THREE.SpriteMaterial({
                map: textureTree
            });
            // 创建精灵模型对象
            var sprite = new THREE.Sprite(spriteMaterial);
            scene.add(sprite);
            // 控制精灵大小,
            sprite.scale.set(.3, .6, 1); //只需要设置x、y两个分量就可以
            //set position
            // var k1 = Math.random() - 0.5;
            // var k2 = Math.random() - 0.5;
            // var k3 = Math.random() ;
            // 设置精灵模型位置，在整个空间上上随机分布
            // sprite.position.set(100 * k1, sky*k3, 100 * k2);
            sprite.position.set(Math.floor(Math.random() * maxRange - minRange), Math.floor(Math.random() * maxRange - minRange), Math.floor(Math.random() * maxRange - minRange));
            rainGroupSummer.add(sprite);
        }
        scene.add(rainGroupSummer); //雨滴群组插入场景中
    }, function (error) { console.error("rain texture failed to load:", error); });
}
function summerShow() {
    summerFlag = true;
    rainGroupSummer.visible = true;
    setLight(new three_1.Color(0xcc0000));
    audioLoader.load(summerMusic, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });
}
function springInit() {
    scene.add(instancedMesh);
    for (var i = 0; i < instanceNumber; i++) {
        dummy.position.set((Math.random() - 0.5) * groundSize, 0, (Math.random() - 0.5) * groundSize);
        dummy.scale.setScalar(0.5 + Math.random() * 0.5);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
}
function setLight(color) {
    ambient.color = color;
}
function springShow() {
    springFlag = true;
    setLight(new three_1.Color(0x00ff00));
    instancedMesh.visible = true;
    audioLoader.load(springMusic, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });
}
function fallShow() {
    fallFlag = true;
    setLight(new three_1.Color(0xcccc00));
    birds.forEach(function (it) {
        it.mesh.visible = true;
    });
    audioLoader.load(fallMusic, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });
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
    birds.forEach(function (it) {
        it.mesh.visible = false;
    });
    audio.pause();
}
var PileEvent = /** @class */ (function (_super) {
    __extends(PileEvent, _super);
    function PileEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PileEvent.prototype.pile = function (pileX, pileZ) {
        this.dispatchEvent({ type: 'pile', x: pileX, z: pileZ });
    };
    return PileEvent;
}(three_1.EventDispatcher));
;
// disabling AA (antialiasing) to increase performance on macs with retina displays
// https://attackingpixels.com/tips-tricks-optimizing-three-js-performance/
var pixelRatio = window.devicePixelRatio;
var AA = true;
if (pixelRatio > 1) {
    AA = false;
}
var renderer = new THREE.WebGLRenderer({
    antialias: AA,
    powerPreference: "high-performance"
});
renderer.setSize(width, height); //设置渲染区域尺寸
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
var pileListener = new PileEvent();
var seasonListener = new SeasonEvent();
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
var flipflag = true;
var flipstart = 0;
seasonListener.inform(SeasonType.Spring);
function render(timestamp) {
    var time = timestamp * 0.001;
    console.log(time);
    plane.rotation.y += 0.005;
    plane.rotation.z += 0.005;
    if (rotationSetting) {
        if (time - start >= 30) {
            start = time;
            seasonListener.next();
        }
    }
    if (fallFlag) {
        if (time - flipstart >= 0.3) {
            flipstart = time;
            if (flipflag) {
                birds.forEach(function (bird) {
                    if (bird.mesh.position.x > maxRange / 2)
                        bird.mesh.position.x = -maxRange / 2;
                    bird.mesh.position.x += 1.5;
                    bird.birdgeometry.getAttribute('position').setX(4, -35);
                    bird.birdgeometry.getAttribute('position').setY(4, 15);
                    bird.birdgeometry.getAttribute('position').setX(7, 35);
                    bird.birdgeometry.getAttribute('position').setY(7, 15);
                    bird.birdgeometry.attributes.position.needsUpdate = true;
                });
                flipflag = false;
            }
            else if (!flipflag) {
                birds.forEach(function (bird) {
                    bird.mesh.position.x += 1.5;
                    bird.birdgeometry.getAttribute('position').setX(4, -35);
                    bird.birdgeometry.getAttribute('position').setY(4, -15);
                    bird.birdgeometry.getAttribute('position').setX(7, 35);
                    bird.birdgeometry.getAttribute('position').setY(7, -15);
                    bird.birdgeometry.attributes.position.needsUpdate = true;
                });
                flipflag = true;
            }
        }
    }
    if (summerFlag) {
        rainGroupSummer.children.forEach(function (sprite) {
            // 雨滴的y坐标每次减1
            sprite.position.y -= rainDropSpeed;
            if (sprite.position.y < 0) {
                // 如果雨滴落到地面，重置y，重新下落
                sprite.position.y += sky;
            }
        });
    }
    if (springFlag) {
        leavesMaterial.uniforms.time.value = clock.getElapsedTime();
        leavesMaterial.uniformsNeedUpdate = true;
    }
    if (winterFlag)
        snowGroupWinter.children.forEach(function (sprite, i) {
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
    requestAnimationFrame(render); //请求再次执行渲染函数render，渲染下一帧
}
requestAnimationFrame(render);
// var controls = new CONTROL.OrbitControls(camera, renderer.domElement);//创建控件对象
// controls.addEventListener('change', render);//监听鼠标、键盘事件
