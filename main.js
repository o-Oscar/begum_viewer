import './style.css'

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg') });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true;
// renderer.shadowMapType = THREE.PCFSoftShadowMap;

const useControls = false;
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
if (useControls) {
    const controls = new OrbitControls(camera, renderer.domElement);
}

camera.quaternion.w = 0.95977;
camera.quaternion.x = -0.12165;
camera.quaternion.y = 0.25106;
camera.quaternion.z = 0.03182;
camera.position.x = 4.17089;
camera.position.y = 4.13203;
camera.position.z = 10.80976;
// controls.target.x = -1.85121;
// controls.target.y = 0.96336;
// controls.target.z = 0.08642;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);


var all_meshes = []

function setMaterialsOnGLTF(object3D, color) {

    object3D.castShadow = true;
    object3D.receiveShadow = true;

    if (object3D.material) {
        const newMaterial = new THREE.MeshPhongMaterial({ color: color });
        object3D.material = newMaterial;
    }
    if (!object3D.children) {
        return;
    }
    for (let i = 0; i < object3D.children.length; i++) {
        setMaterialsOnGLTF(object3D.children[i], color);
    }
}

function load_mesh(loader, name, id) {
    function add_mesh(gltf, dz, ry, id) {
        var obj = gltf.scene;
        obj.position.z = dz;
        obj.rotation.y = ry * Math.PI / 180;
        obj.userData.id = id

        setMaterialsOnGLTF(obj, document.querySelector("#" + id + " button").style.backgroundColor)

        scene.add(obj)
        all_meshes.push(obj)
    }

    loader.load(name, function (gltf) { add_mesh(gltf, -1, 10, id) }, undefined, function (error) {
        console.error(error);
    });

    loader.load(name, function (gltf) { add_mesh(gltf, 1, -10, id) }, undefined, function (error) {
        console.error(error);
    });
}

function build_shoe() {
    const loader = new GLTFLoader();
    load_mesh(loader, "models/body.glb", "body")
    load_mesh(loader, "models/front.glb", "front")
    load_mesh(loader, "models/heel.glb", "heel")
    load_mesh(loader, "models/highlight.glb", "highlight")
    load_mesh(loader, "models/sole.glb", "sole")

    loader.load("models/backdrop.glb", function (gltf) {
        const obj = gltf.scene;
        setMaterialsOnGLTF(obj, 0xfff0ff)
        scene.add(obj)
    }, undefined, function (error) {
        console.error(error);
    });
}

build_shoe()

const pointLight = new THREE.PointLight(0xffffff, 0.3);
pointLight.position.set(-3, 3, 5);
scene.add(pointLight)
// scene.add(new THREE.PointLightHelper(pointLight, 0.3));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.position.set(-3, 4, 5);
scene.add(dirLight)
// scene.add(new THREE.DirectionalLightHelper(dirLight))

const ambientLight = new THREE.AmbientLight(0x666666);
ambientLight.castShadow = true;
scene.add(ambientLight)

// scene.add(new THREE.GridHelper(200, 50))

// camera clipboard position copy
var infobox = document.querySelector('#copy_cam_pos')
infobox.onclick = function myFunction() {
    var copyText = "camera.quaternion.w = " + camera.quaternion.w.toFixed(5) + ";" +
        "\ncamera.quaternion.x = " + camera.quaternion.x.toFixed(5) + ";" +
        "\ncamera.quaternion.y = " + camera.quaternion.y.toFixed(5) + ";" +
        "\ncamera.quaternion.z = " + camera.quaternion.z.toFixed(5) + ";" +
        "\ncamera.position.x = " + camera.position.x.toFixed(5) + ";" +
        "\ncamera.position.y = " + camera.position.y.toFixed(5) + ";" +
        "\ncamera.position.z = " + camera.position.z.toFixed(5) + ";" +
        "\ncontrols.target.x = " + controls.target.x.toFixed(5) + ";" +
        "\ncontrols.target.y = " + controls.target.y.toFixed(5) + ";" +
        "\ncontrols.target.z = " + controls.target.z.toFixed(5) + ";";

    navigator.clipboard.writeText(copyText);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);

var cur_selected_id = -1;
var cur_selected = [];
function changeSelectedId(id) {
    cur_selected_id = id;
    cur_selected = []

    for (var obj of all_meshes) {
        if (obj.userData.id == cur_selected_id) {
            cur_selected.push(obj)
        }
    }
    outlinePass.selectedObjects = cur_selected
}

function onPointerMove(event) {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(all_meshes);

    if (intersects.length > 0) {
        changeSelectedId(intersects[0].object.parent.userData.id)
    } else {
        changeSelectedId(-1)
    }

}
// document.querySelector('#bg').onclick = onPointerMove;

for (var name of ["body", "highlight", "heel", "sole", "front"]) (function (name) {
    for (var button of document.querySelectorAll("#" + name + " button")) {
        button.onclick = function (event) {

            for (var obj of all_meshes) {
                if (obj.userData.id == name) {
                    setMaterialsOnGLTF(obj, event.target.style.backgroundColor)
                }
            }
        }
    }
})(name);


function animate() {
    requestAnimationFrame(animate);

    if (useControls) {
        controls.update()
    }
    composer.render();
}


animate()