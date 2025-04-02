import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight }

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 10000) 

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({canvas})
renderer.setSize(sizes.width, sizes.height) 
renderer.setPixelRatio(2)
renderer.render(scene, camera)

// Controls
const controls = new OrbitControls(camera, canvas)

export {sizes, scene, camera, renderer, controls}