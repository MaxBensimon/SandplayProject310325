import * as THREE from 'three'; 

// Water
const waterMat = new THREE.MeshStandardMaterial({color: "#00bfff"})

const bottomGeo = new THREE.BoxGeometry(10, .1, 10)
const sideZGeo = new THREE.BoxGeometry(10.2, 1, .1)
const sideXGeo = new THREE.BoxGeometry(.1, 1, 10)

const bottomWaterCube = new THREE.Mesh(bottomGeo, waterMat)
const side1WaterCube = new THREE.Mesh(sideZGeo, waterMat)
const side2WaterCube = new THREE.Mesh(sideXGeo, waterMat)
const side3WaterCube = new THREE.Mesh(sideZGeo, waterMat)
const side4WaterCube = new THREE.Mesh(sideXGeo, waterMat)

bottomWaterCube.position.y = -1.25 // Lige under det nederst lag, hvis der er 12 lag.

side1WaterCube.position.y = -.8
side1WaterCube.position.z = -5.05

side2WaterCube.position.y = -.8
side2WaterCube.position.x = -5.05

side3WaterCube.position.y = -.8
side3WaterCube.position.z = 5.05

side4WaterCube.position.y = -.8
side4WaterCube.position.x = 5.05

export {bottomWaterCube, side1WaterCube, side2WaterCube, side3WaterCube, side4WaterCube}