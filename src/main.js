import * as THREE from 'three'; 
import "./style.css"
import gsap from "gsap"
import * as COMPONENTS from "./components.js"
import * as MESHES from "./meshes.js"

const sizes = COMPONENTS.sizes
const scene = COMPONENTS.scene
const camera = COMPONENTS.camera
const renderer = COMPONENTS.renderer
const controls = COMPONENTS.controls
scene.add(sizes, scene, camera, renderer)

// Water
scene.add(MESHES.bottomWaterCube)
scene.add(MESHES.side1WaterCube)
scene.add(MESHES.side2WaterCube)
scene.add(MESHES.side3WaterCube)
scene.add(MESHES.side4WaterCube)


// Scene settings:
scene.background = new THREE.Color("#ffffff")

// Camera settings:
camera.position.x = 10
camera.position.y = 10
camera.position.z = 10

// Controls settings:
controls.enabled = true
controls.enableDamping = false
controls.enablePan = false
controls.enableZoom = true

// Material
const material = new THREE.MeshStandardMaterial({ color: "#ffffff", })

// Light
const light = new THREE.PointLight(0xffffff, 175, 100)
const ambientLight = new THREE.AmbientLight(0x404040, 30)
light.position.set(0, 10, 0)
scene.add(light)
scene.add(ambientLight)






let isShiftPressed = false
let isRemoving = false
let isControlPressed = false
let isAdding = false

// Slider values fra DOM
const overlaySphereSlider = document.getElementById('overlaySphereSize')
const overlaySphereSliderValue = document.getElementById('overlaySphereSliderValue')

const addRemoveDelaySlider = document.getElementById('addRemoveDelay')
const addRemoveDelaySliderValue = document.getElementById('addRemoveDelaySliderValue')

// Størrelsen på overlaySphere er altid sliderens value
var overlaySphereSize = parseFloat(overlaySphereSlider.value)

// Hastigheden på addRemoveDelay er altid sliderens value
var addRemoveDelay = parseFloat(addRemoveDelaySlider.value)

// Raycast
const raycaster = new THREE.Raycaster();

// Plane
//const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0))

// PlaneHelper
// var isPlaneHelperActive = false
// const planeHelper = new THREE.PlaneHelper(plane, 10, 0xf200ff);
// //scene.add(planeHelper);

let lastIntersection = new THREE.Vector3()
let lastNormal = new THREE.Vector3(0, 1, 0)
const tempMatrix = new THREE.Matrix4()
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

// Pointer
var pointer = new THREE.Vector2()

// Overlay Sphere
const overlayGeo = new THREE.SphereGeometry(overlaySphereSize, 32, 16)
const overlayMat = new THREE.MeshBasicMaterial(
  {
    color: 0xff0000,
    transparent: true,
    opacity: .25,
    //blending: THREE.AdditiveBlending
  }
)
const overlaySphere = new THREE.Mesh(overlayGeo, overlayMat);
//overlaySphere.position.y = 1


// Grid
var gridSize = 10
var gridDivisions = 100
var layers = 12
const totalCount = gridDivisions * gridDivisions * layers;
const cellsPerLayer = gridDivisions * gridDivisions

// Geting the size of a single cell in the grid
const cellSize = gridSize / gridDivisions



// Plane til under InstancedMesh, så der er noget at intersecte med.
const fallbackPlane = new THREE.Mesh(new THREE.PlaneGeometry(gridSize, gridSize), new THREE.MeshBasicMaterial({visible: false})) // Nice måde at erklære en mesh på med færre linjer!
fallbackPlane.rotation.x = -Math.PI/2 // Gør den horisontal
fallbackPlane.position.y = (cellSize/2) - (cellSize * layers)
scene.add(fallbackPlane)



// Making some cubes based on the grid cell size
const cubeGeo = new THREE.BoxGeometry(cellSize, cellSize, cellSize)
const cubeMat = new THREE.MeshStandardMaterial({color: "#ffe6a1", roughness: 1})

// InstancedMesh
const instancedMesh = new THREE.InstancedMesh(cubeGeo, cubeMat, totalCount);
instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

// De objects der må raycastes med. Bliver brugt i mousemove
const raycastableObjects = [instancedMesh, fallbackPlane, MESHES.bottomWaterCube, MESHES.side1WaterCube, MESHES.side2WaterCube, MESHES.side3WaterCube, MESHES.side4WaterCube]


let index = 0;
const matrix = new THREE.Matrix4();

for (let height = 0; height < layers; height++)
{
  for (let i = 0; i < gridDivisions; i++)
  {
    for (let j = 0; j < gridDivisions; j++)
    {
      const x = (i * cellSize) - (gridSize / 2) + (cellSize / 2);
      const z = (j * cellSize) - (gridSize / 2) + (cellSize / 2);
      const y = (cellSize * height) + (cellSize / 2) - (cellSize * layers) // Den sidste del her får cubes til at spawne nedad: '- (cellSize * layers)'.
      
      matrix.makeTranslation(x, y, z);
      instancedMesh.setMatrixAt(index++, matrix);

      //console.log(`${x}, ${y}, ${z}`);
    }
  }
}

instancedMesh.computeBoundingSphere();
scene.add(instancedMesh);

const activeInstances = new Array(totalCount).fill(true) // De cubes der ikke er væk.

for (let i = layers; i > 5; i--) // Fjerner de øverste lag (ved 'layers = 12' vil 'i > 5' fjerne halvdelen)
{
  removeLayer(i)
}

function HideRandomInstance(layer)
{
  const layerStartIndex = layer * cellsPerLayer
  const layerEndIndex = layerStartIndex + cellsPerLayer

  const availableIndices = []

  for (let i = layerStartIndex; i < layerEndIndex; i++)
  {
    if (activeInstances[i])
    {
      availableIndices.push(i)
    }
  }

  if (availableIndices.length === 0)
  {
    console.log(`No active instances left in layer ${layer}`);
    return;
  }

  // Vælg en tilfældig tilgængelig cube 
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]

  const matrix = new THREE.Matrix4()

  // Få fat på den oprindelig position af cuben
  instancedMesh.getMatrixAt(randomIndex, matrix)
  const position = new THREE.Vector3()
  matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

  // Gør cuben meget lille
  matrix.makeScale(0, 0, 0).setPosition(position)
  instancedMesh.setMatrixAt(randomIndex, matrix);
  instancedMesh.instanceMatrix.needsUpdate = true;
  activeInstances[randomIndex] = false;
}

// Key down event
document.addEventListener('keydown', (event) =>
  {

  if (event.key === 'Shift')
  {
    isShiftPressed = true
    overlayMat.color = new THREE.Color('#ff0000')
    scene.add(overlaySphere)
  }

  if (event.key === 'Control')
  {
    isControlPressed = true
    overlayMat.color = new THREE.Color('#00ff3c')
    scene.add(overlaySphere)
  }

  // if (event.key.toLowerCase() == 'p')
  // {
  //   isPlaneHelperActive = !isPlaneHelperActive
  //   if (isPlaneHelperActive)
  //     scene.add(planeHelper)
  //   else
  //     scene.remove(planeHelper)
  // }

  // if (event.key.toLowerCase() == 'e')
  //   plane.position.y -= 1

  if (event.key.toLowerCase() === '1')
  {
    HideRandomInstance(0);
  }
  if (event.key.toLowerCase() === '2')
  {
    HideRandomInstance(1);
  }
  if (event.key.toLowerCase() === '3')
  {
    HideRandomInstance(2);
  }
  if (event.key.toLowerCase() === '4')
  {
    HideRandomInstance(3);
  }
  if (event.key.toLowerCase() === '5')
    {
      HideRandomInstance(4);
    }
})

// Mouse button events
document.addEventListener('mousedown', (event) =>
{
  if (isShiftPressed)
    isRemoving = true
  if (isControlPressed)
    isAdding = true
})
document.addEventListener('mouseup', () => {
  isRemoving = false
  isAdding = false
})

// Key up event
document.addEventListener('keyup', (event) =>
{
  if (event.key === 'Shift')
  {
    isShiftPressed = false
    scene.remove(overlaySphere)
  }
  if (event.key === 'Control')
    {
      isControlPressed = false
      scene.remove(overlaySphere)
    }
})

// Move mouse event
document.addEventListener('mousemove', (event) =>
{
  if (!isShiftPressed && !isControlPressed)
    return

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(raycastableObjects, true)
  
  if (intersects.length > 0)
  {
    // Hvis der er intersection med noget, der er i racastbleObjects og ikke er fallbackPlane 
    const validIntersect = intersects.find(i => i.object !== fallbackPlane) || intersects[0]
    lastIntersection.copy(validIntersect.point)
    
    // Hvis der er intersection med fallbackPlane
    if (validIntersect.object === fallbackPlane)
    {
      lastIntersection.x = Math.round(lastIntersection.x / cellSize) * cellSize
      lastIntersection.z = Math.round(lastIntersection.z / cellSize) * cellSize
    }
    
    overlaySphere.position.copy(lastIntersection)
  }
})

// Håndtering af sliderens værdi:
overlaySphereSlider.addEventListener('input', function()
{
  // Først sættes værdien af overlaySphere
  overlaySphereSize = parseFloat(this.value)
  overlaySphereSliderValue.textContent = "Overlay sphere size: " + overlaySphereSize.toFixed(1)

  // Den gamle geo fjernes fra memory
  overlaySphere.geometry.dispose()
  // Ny geo bliver lavet med værdien fra slideren
  overlaySphere.geometry = new THREE.SphereGeometry(overlaySphereSize, 32, 16)
})
addRemoveDelaySlider.addEventListener('input', function()
{
  addRemoveDelay = parseFloat(this.value)
  addRemoveDelaySliderValue.textContent = "Add/Remove delay speed: " + addRemoveDelay.toFixed(1)
})

function checkSphereCollision(forAdding = false)
{
  // Den her metode skal kunne tjekke om noget er aktive eller ej. Det gør den med true/false:
  // Hvis noget er true, så kan det fjernes og ikke tilføjes
  // Hvis noget er false (se forAdding), så kan det tilføjes og ikke fjernes.
  // Altså: Hvis activeInstances[i] == false, så kan den tilføjes og vice versa.
  // Standarden er true, da det er det som function er refaktoreret af.


  const spherePos = overlaySphere.position
  const sphereRadius = overlaySphere.geometry.parameters.radius
  const collidedIndices = []

  const tempMatrix = new THREE.Matrix4()
  const tempPosition = new THREE.Vector3()

  for (let i = 0; i < totalCount; i++)
  {
    instancedMesh.getMatrixAt(i, tempMatrix)
    tempMatrix.decompose(tempPosition, new THREE.Quaternion(), new THREE.Vector3())

    const distance = tempPosition.distanceTo(spherePos)
    if (distance < sphereRadius)
      collidedIndices.push(i)
  }
  return collidedIndices
}

let canRemove = true
function removeCubes(collidedIndices)
{
  if (!canRemove) return
  canRemove = false

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()

  // For hver ting, der collides med:
  collidedIndices.forEach(index =>
  {
    // Hvis den er active (ikke meget lille):
    if (activeInstances[index])
    {
      // Få fat på den specifikke cube i meshen:
      instancedMesh.getMatrixAt(index, matrix)
      // Bryd den del ned som en Quaternion og en Vector3
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      // Gør den meget lille omkring dens position
      matrix.makeScale(0, 0, 0).setPosition(position)
      instancedMesh.setMatrixAt(index, matrix)

      // Gør cuben inaktiv
      activeInstances[index] = false
    }
  })

  //updateColumnTopMarkers()

  // Opdatér instancedMeshen
  instancedMesh.instanceMatrix.needsUpdate = true
  
  // Timeout på add så det er lidt nemmere at styre
  setTimeout(() => {
    canRemove = true
  }, addRemoveDelay)
}

function removeLayer(layer)
{
  const startIndex = layer * cellsPerLayer
  const endIndex = startIndex + cellsPerLayer

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  let isUpdateNeeded = false

  for (let i = startIndex; i < endIndex; i++)
  {
    if (activeInstances[i])
    {
      instancedMesh.getMatrixAt(i, matrix)
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      matrix.makeScale(0, 0, 0,).setPosition(position)
      instancedMesh.setMatrixAt(i, matrix)

      activeInstances[i] = false
      isUpdateNeeded = true
    }
  }
  if (isUpdateNeeded)
  {
    //updateColumnTopMarkers()

    instancedMesh.instanceMatrix.needsUpdate = true
  }
}

let canAdd = true
function addCubes(collidedIndices)
{
  if (!canAdd) return

  canAdd = false

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()

  // For hver ting, der collides med:
  collidedIndices.forEach(index =>
  {
    // Hvis den IKKE er active (ikke meget lille):
    if (!activeInstances[index])
    {
      // Få fat på den specifikke cube i meshen:
      instancedMesh.getMatrixAt(index, matrix)
      // Bryd den del ned som en Quaternion og en Vector3
      matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

      // Gør den stor igen omkring dens position
      matrix.makeScale(1, 1, 1).setPosition(position)
      instancedMesh.setMatrixAt(index, matrix)

      // Gør cuben aktiv
      activeInstances[index] = true
    }
  })

  //>updateColumnTopMarkers()

  // Opdatér instancedMeshen
  instancedMesh.instanceMatrix.needsUpdate = true

  // Timeout på add så det er lidt nemmere at styre
  setTimeout(() => {
    canAdd = true
  }, addRemoveDelay)
}













// Gravity
function applyGravity()
{
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  let isGravityUpdateNeeded = false

  for (let layer = layers - 1; layer > 0; layer--)
  {
    const layerStart = layer * cellsPerLayer
    const layerBelowStart = (layer - 1) * cellsPerLayer

    for (let i = 0; i < cellsPerLayer; i++)
    {
      const currentIndex = layerStart + i
      const currentBelowIndex = layerBelowStart + i

      // Lav kun operationer hvis det nuværende index har en active cube og det under IKKE har
      if (activeInstances[currentIndex] && !activeInstances[currentBelowIndex])
      {
        instancedMesh.getMatrixAt(currentIndex, matrix)
        matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3())

        matrix.makeScale(0, 0, 0).setPosition(position)
        instancedMesh.setMatrixAt(currentIndex, matrix)
        activeInstances[currentIndex] = false

        position.y -= cellSize
        const newMatrix = new THREE.Matrix4().makeScale(1, 1, 1).setPosition(position)
        instancedMesh.setMatrixAt(currentBelowIndex, newMatrix)
        activeInstances[currentBelowIndex] = true

        isGravityUpdateNeeded = true
      }
    }
  }
  if (isGravityUpdateNeeded)
  {
    //updateColumnTopMarkers()

    instancedMesh.instanceMatrix.needsUpdate = true
    return true
  }
  return false
}

function simulateGravity()
{
  let totalPasses = 0
  const maxPasses = layers * 2

  while (applyGravity() && totalPasses < maxPasses)
    totalPasses
}












// Resizing
window.addEventListener('resize', () =>{
// Updating the sizes
sizes.width = window.innerWidth
sizes.height = window.innerHeight
// Updating the camera as well
camera.aspect = sizes.width / sizes.height
camera.updateProjectionMatrix()
renderer.setSize(sizes.width, sizes.height)
})


// Jeg bør nok flytte kaldet af start
start()
function start()
{
  overlaySphereSliderValue.textContent = "Overlay sphere size: " + overlaySphereSize.toFixed(1)
  addRemoveDelaySliderValue.textContent = "Add/Remove delay speed: " + addRemoveDelay.toFixed(1)
}


// Defines a loop that works kind of like unity's Update method
const loop = () =>
{
controls.update()

if (isRemoving)
{
  const collidedIndices = checkSphereCollision(false)
  if (collidedIndices.length > 0)
  {
    removeCubes(collidedIndices)
    simulateGravity()
  }
}

if (isAdding)
{
  const collidedIndices = checkSphereCollision(true)
  if (collidedIndices.length > 0)
  {
    addCubes(collidedIndices)
    simulateGravity()
  }
}

renderer.render(scene, camera)
window.requestAnimationFrame(loop)
}

// Calling the loop
loop()