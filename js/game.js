//COLORS
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    brownDark:0x23190f,
    pink:0xF5986E,
    yellow:0xf4ce93,
    blue:0x68c3c0,
    
    // 障碍物等级颜色
    enemyTier1: 0x802020, // 暗红 (小)
    enemyTier2: 0xf25346, // 标准红 (中)
    enemyTier3: 0xff8888, // 鲜艳红 (大)
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

// 显式声明 holder 变量
var ennemiesHolder, coinsHolder, particlesHolder, projectilesHolder;
// 子弹池
var projectilesPool = [];
// 奖励关卡UI
var bonusMessage;

function resetGame(){
  game = {speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:0, 
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          planeCollisionDisplacementX:0,
          planeCollisionSpeedX:0,

          planeCollisionDisplacementY:0,
          planeCollisionSpeedY:0,

          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,
          cameraFov: 60, // Python 控制的 FOV

          coinDistanceTolerance:15,
          coinValue:1,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100, // 正常金币生成距离

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          // 武器系统参数
          baseWeaponRange: 150,
          weaponSpeed: 1.5,
          weaponFireRate: 0.3,
          lastShotTime: 0,
          bulletDamage: 1,

          // 【新增】奖励关卡参数
          bonusDuration: 10000, // 10秒
          bonusStartTime: 0,
          
          status : "playing",
         };
  
  if (typeof fieldLevel !== 'undefined') fieldLevel.innerHTML = Math.floor(game.level);
  // 隐藏奖励提示
  if (bonusMessage) bonusMessage.style.display = "none";

  // 重置飞机位置
  if (typeof airplane !== 'undefined' && airplane) {
      airplane.mesh.position.y = game.planeDefaultHeight;
      airplane.mesh.position.x = 0;
      airplane.mesh.rotation.set(0,0,0);
  }

  // 清理障碍物
  if (typeof ennemiesHolder !== 'undefined' && ennemiesHolder && ennemiesHolder.ennemiesInUse) {
      for (var i = 0; i < ennemiesHolder.ennemiesInUse.length; i++) {
          ennemiesHolder.mesh.remove(ennemiesHolder.ennemiesInUse[i].mesh);
          ennemiesPool.push(ennemiesHolder.ennemiesInUse[i]);
      }
      ennemiesHolder.ennemiesInUse = [];
  }

  // 清理金币
  if (typeof coinsHolder !== 'undefined' && coinsHolder && coinsHolder.coinsInUse) {
      for (var i = 0; i < coinsHolder.coinsInUse.length; i++) {
          coinsHolder.mesh.remove(coinsHolder.coinsInUse[i].mesh);
          coinsHolder.coinsPool.push(coinsHolder.coinsInUse[i]);
      }
      coinsHolder.coinsInUse = [];
  }

  // 清理粒子
  if (typeof particlesHolder !== 'undefined' && particlesHolder && particlesHolder.particlesInUse) {
      for (var i = 0; i < particlesHolder.particlesInUse.length; i++) {
          particlesHolder.mesh.remove(particlesHolder.particlesInUse[i].mesh);
          particlesPool.push(particlesHolder.particlesInUse[i]);
      }
      particlesHolder.particlesInUse = [];
  }

  // 清理子弹
  if (typeof projectilesHolder !== 'undefined' && projectilesHolder && projectilesHolder.projectilesInUse) {
      for (var i = 0; i < projectilesHolder.projectilesInUse.length; i++) {
          projectilesHolder.mesh.remove(projectilesHolder.projectilesInUse[i].mesh);
          projectilesPool.push(projectilesHolder.projectilesInUse[i]);
      }
      projectilesHolder.projectilesInUse = [];
  }
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60; // 默认值改为60
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  // 必须确保 game 存在
  if (game && game.status == "waitingReplay"){
    resetGame();
    hideReplay();
    oldTime = new Date().getTime();
  }
}

function handleTouchEnd(event){
  if (game && game.status == "waitingReplay"){
    resetGame();
    hideReplay();
    oldTime = new Date().getTime();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  ambientLight = new THREE.AmbientLight(0xdc8874, .5);
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

var Pilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs=0;
  var bodyGeom = new THREE.BoxGeometry(15,15,15);
  var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2,-12,0);
  this.mesh.add(body);
  var faceGeom = new THREE.BoxGeometry(10,10,10);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);
  var hairGeom = new THREE.BoxGeometry(4,4,4);
  var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();
  this.hairsTop = new THREE.Object3D();
  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);
  var hairSideGeom = new THREE.BoxGeometry(12,4,2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8,-2,6);
  hairSideL.position.set(8,-2,-6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);
  var hairBackGeom = new THREE.BoxGeometry(2,8,10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1,-4,0)
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);
  this.mesh.add(hairs);
  var glassGeom = new THREE.BoxGeometry(5,5,5);
  var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var glassR = new THREE.Mesh(glassGeom,glassMat);
  glassR.position.set(6,0,3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z
  var glassAGeom = new THREE.BoxGeometry(11,1,11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);
  var earGeom = new THREE.BoxGeometry(2,3,2);
  var earL = new THREE.Mesh(earGeom,faceMat);
  earL.position.set(0,0,-6);
  var earR = earL.clone();
  earR.position.set(0,0,6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}
Pilot.prototype.updateHairs = function(){
   var hairs = this.hairsTop.children;
   var l = hairs.length;
   for (var i=0; i<l; i++){
      var h = hairs[i];
      h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
   }
  this.angleHairs += game.speed*deltaTime*40;
}
var AirPlane = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";
  var geomCabin = new THREE.BoxGeometry(80,50,50,1,1,1);
  var matCabin = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  geomCabin.vertices[4].y-=10;
  geomCabin.vertices[4].z+=20;
  geomCabin.vertices[5].y-=10;
  geomCabin.vertices[5].z-=20;
  geomCabin.vertices[6].y+=30;
  geomCabin.vertices[6].z+=20;
  geomCabin.vertices[7].y+=30;
  geomCabin.vertices[7].z-=20;
  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);
  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);
  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);
  var geomSideWing = new THREE.BoxGeometry(30,5,120,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);
  var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);
  windshield.castShadow = true;
  windshield.receiveShadow = true;
  this.mesh.add(windshield);
  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  geomPropeller.vertices[4].y-=5;
  geomPropeller.vertices[4].z+=5;
  geomPropeller.vertices[5].y-=5;
  geomPropeller.vertices[5].z-=5;
  geomPropeller.vertices[6].y+=5;
  geomPropeller.vertices[6].z+=5;
  geomPropeller.vertices[7].y+=5;
  geomPropeller.vertices[7].z-=5;
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;
  var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8,0,0);
  blade1.castShadow = true;
  blade1.receiveShadow = true;
  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;
  blade2.castShadow = true;
  blade2.receiveShadow = true;
  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60,0,0);
  this.mesh.add(this.propeller);
  var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
  wheelProtecR.position.set(25,-20,25);
  this.mesh.add(wheelProtecR);
  var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
  var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
  wheelTireR.position.set(25,-28,25);
  var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
  wheelTireR.add(wheelAxis);
  this.mesh.add(wheelTireR);
  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z ;
  this.mesh.add(wheelProtecL);
  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);
  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5,.5,.5);
  wheelTireB.position.set(-35,-5,0);
  this.mesh.add(wheelTireB);
  var suspensionGeom = new THREE.BoxGeometry(4,20,4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0))
  var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
  suspension.position.set(-35,-5,0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);
  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10,27,0);
  this.mesh.add(this.pilot.mesh);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};
Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.seaRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}
Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;
}
Sea = function(){
  var geom = new THREE.CylinderGeometry(game.seaRadius,game.seaRadius,game.seaLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;
  this.waves = [];
  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     ang:Math.random()*Math.PI*2,
                     amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
                     speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;
}
Sea.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    vprops.ang += vprops.speed*deltaTime;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}
Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,
  });
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;
  }
}
Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(8,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red, // 默认颜色
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.health = 1;
  this.tier = 1; 
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;
  if (game.level == 0) nEnnemies = 1; 

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    
    // 障碍物等级逻辑
    var rand = Math.random();
    var tier = 1; 

    if (game.level <= 1) {
        tier = 1; 
    } else if (game.level == 2) {
        tier = (rand > 0.5) ? 2 : 1;
    } else if (game.level == 3) {
        tier = (rand > 0.3) ? 2 : 1;
    } else if (game.level == 4) {
        if (rand < 0.33) tier = 1;
        else if (rand < 0.66) tier = 2;
        else tier = 3;
    } else if (game.level == 5) {
        tier = (rand > 0.5) ? 3 : 2;
    } else if (game.level >= 6) {
        tier = (rand > 0.3) ? 3 : 2;
    }

    // 设置障碍物属性
    ennemy.tier = tier; 
    ennemy.health = tier; 
    
    // 设置大小和颜色
    var scale = 1;
    var colorHex = Colors.enemyTier2; // 默认红色

    if (tier == 1) {
        scale = 1.0;
        colorHex = Colors.enemyTier1; // 暗红
    } else if (tier == 2) {
        scale = 1.5;
        colorHex = Colors.enemyTier2; // 标准红
    } else if (tier == 3) {
        scale = 2.0;
        colorHex = Colors.enemyTier3; // 鲜艳红
    }
    
    ennemy.mesh.scale.set(scale, scale, scale);
    // 动态修改颜色
    ennemy.mesh.material.color.setHex(colorHex);

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    // 飞机与障碍物碰撞检测
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      // 根据障碍物等级扣除能量
      var damageMultiplier = 1 + (ennemy.tier - 1) * 0.5;
      removeEnergy(damageMultiplier);
      
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

Coin = function(){
  var geom = new THREE.TetrahedronGeometry(5,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}

var Projectile = function(){
    var geom = new THREE.BoxGeometry(8, 2, 2); 
    var mat = new THREE.MeshPhongMaterial({color: Colors.brownDark, shading: THREE.FlatShading});
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.distTraveled = 0; 
}

var ProjectilesHolder = function(){
    this.mesh = new THREE.Object3D();
    this.projectilesInUse = [];
}

ProjectilesHolder.prototype.spawnProjectile = function(position){
    var projectile;
    if(projectilesPool.length){
        projectile = projectilesPool.pop();
    } else {
        projectile = new Projectile();
    }
    
    projectile.mesh.position.copy(position);
    projectile.distTraveled = 0;
    
    this.mesh.add(projectile.mesh);
    this.projectilesInUse.push(projectile);
}

function shoot(){
    if (game.level < 1) return;

    var currentTime = new Date().getTime();
    if (currentTime - game.lastShotTime < game.weaponFireRate * 1000) return;
    
    game.lastShotTime = currentTime;

    var p = airplane.mesh.position.clone();
    
    if (game.level == 1 || game.level == 3) {
        p.x += 10; 
        projectilesHolder.spawnProjectile(p);
    }
    else if (game.level == 2 || game.level == 4 || game.level == 5) {
        var pUp = p.clone();
        var pDown = p.clone();
        pUp.x += 10;
        pUp.y += 5; // 上方
        pDown.x += 10;
        pDown.y -= 5; // 下方
        projectilesHolder.spawnProjectile(pUp);
        projectilesHolder.spawnProjectile(pDown);
    }
    else if (game.level >= 6) {
        var pMid = p.clone();
        var pUp = p.clone();
        var pDown = p.clone();
        pMid.x += 10; 
        pUp.x += 10;
        pUp.y += 8; 
        pDown.x += 10;
        pDown.y -= 8; 
        projectilesHolder.spawnProjectile(pMid);
        projectilesHolder.spawnProjectile(pUp);
        projectilesHolder.spawnProjectile(pDown);
    }
}

function updateProjectiles(){
    // 计算当前等级的射程 (Level 1-2: 1倍; Level 3+: 2倍)
    var currentRange = game.baseWeaponRange;
    if (game.level >= 3) {
        currentRange *= 2;
    }

    if (!projectilesHolder) return;

    for(var i=0; i<projectilesHolder.projectilesInUse.length; i++){
        var projectile = projectilesHolder.projectilesInUse[i];
        
        var speed = game.weaponSpeed * deltaTime;
        projectile.mesh.position.x += speed;
        projectile.distTraveled += speed;
        
        if (projectile.distTraveled > currentRange) {
            projectilesHolder.mesh.remove(projectile.mesh);
            projectilesPool.push(projectile);
            projectilesHolder.projectilesInUse.splice(i,1);
            i--;
            continue;
        }
        
        var hit = false;
        if(ennemiesHolder && ennemiesHolder.ennemiesInUse){
            for(var j=0; j<ennemiesHolder.ennemiesInUse.length; j++){
                var ennemy = ennemiesHolder.ennemiesInUse[j];
                
                var projPos = new THREE.Vector3();
                var enmyPos = new THREE.Vector3();
                
                projectile.mesh.getWorldPosition(projPos);
                ennemy.mesh.getWorldPosition(enmyPos);
                
                var dist = projPos.distanceTo(enmyPos);
                
                if(dist < 30){ 
                    ennemy.health -= game.bulletDamage;
                    particlesHolder.spawnParticles(enmyPos, 3, Colors.white, 0.5);
                    
                    projectilesHolder.mesh.remove(projectile.mesh);
                    projectilesPool.push(projectile);
                    projectilesHolder.projectilesInUse.splice(i,1);
                    i--;
                    hit = true;
                    
                    if(ennemy.health <= 0){
                        particlesHolder.spawnParticles(enmyPos, 10, Colors.red, 1.5);
                        ennemiesHolder.mesh.remove(ennemy.mesh);
                        ennemiesPool.push(ennemy);
                        ennemiesHolder.ennemiesInUse.splice(j,1);
                        j--;
                    }
                    break; 
                }
            }
        }
    }
}

var sea;
var airplane;

function createPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins(){
  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder.mesh)
}

function createProjectiles(){
    projectilesHolder = new ProjectilesHolder();
    scene.add(projectilesHolder.mesh);
}

// 【新增】创建奖励关提示 UI
function createBonusUI() {
    bonusMessage = document.createElement('div');
    bonusMessage.style.position = 'absolute';
    bonusMessage.style.top = '20%';
    bonusMessage.style.left = '0';
    bonusMessage.style.width = '100%';
    bonusMessage.style.textAlign = 'center';
    bonusMessage.style.color = '#ffcc00';
    bonusMessage.style.fontFamily = 'monospace';
    bonusMessage.style.fontSize = '40px';
    bonusMessage.style.fontWeight = 'bold';
    bonusMessage.style.letterSpacing = '2px';
    bonusMessage.style.textShadow = '2px 2px 4px #000000';
    bonusMessage.style.display = 'none'; // 默认隐藏
    bonusMessage.innerHTML = "BONUS STAGE!";
    document.body.appendChild(bonusMessage);
}

function loop(){

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game && game.status == "paused"){
    renderer.render(scene, camera);
    updateDebugPanel();
    requestAnimationFrame(loop);
    return;
  }

  // 状态可以是 playing 或 bonus
  if (game && (game.status=="playing" || game.status=="bonus")){

    // 1. 金币生成逻辑
    // 奖励关卡生成更频繁
    var coinDist = game.distanceForCoinsSpawn;
    if (game.status == "bonus") {
        coinDist = 30; // 奖励关卡金币生成非常快
    }

    if (Math.floor(game.distance) - game.coinLastSpawn > coinDist){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    // 2. 速度更新逻辑
    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }

    // 3. 障碍物生成逻辑 (仅在 playing 状态下生成)
    if (game.status == "playing") {
        if (Math.floor(game.distance) - game.ennemyLastSpawn > game.distanceForEnnemiesSpawn){
            game.ennemyLastSpawn = Math.floor(game.distance);
            ennemiesHolder.spawnEnnemies();
        }
    }

    // 4. 等级提升与奖励关卡触发逻辑
    if (game.status == "playing") {
        // 达到升级距离，触发 Bonus
        if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && 
            Math.floor(game.distance) > game.levelLastUpdate) {
            
            // 标记最后更新位置，防止重复触发
            game.levelLastUpdate = Math.floor(game.distance);
            
            // 切换状态到 bonus
            game.status = "bonus";
            game.bonusStartTime = new Date().getTime();
            
            // 显示 UI
            if (bonusMessage) bonusMessage.style.display = "block";
            
            // 清理当前屏幕上的所有障碍物，营造清爽的奖励时间
            if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
                for (var i = 0; i < ennemiesHolder.ennemiesInUse.length; i++) {
                    ennemiesHolder.mesh.remove(ennemiesHolder.ennemiesInUse[i].mesh);
                    ennemiesPool.push(ennemiesHolder.ennemiesInUse[i]);
                }
                ennemiesHolder.ennemiesInUse = [];
            }
        }
    } else if (game.status == "bonus") {
        // 检查 Bonus 时间是否结束
        if (new Date().getTime() - game.bonusStartTime > game.bonusDuration) {
            // 结束 Bonus，回到 Playing
            game.status = "playing";
            
            // 隐藏 UI
            if (bonusMessage) bonusMessage.style.display = "none";
            
            // 真正提升等级
            game.level++;
            fieldLevel.innerHTML = Math.floor(game.level);
            game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level;
        }
    }

    updatePlane();
    updateDistance();
    updateEnergy();
    
    // 射击和更新子弹
    shoot();
    if (projectilesHolder) updateProjectiles();

    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game && game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (airplane.mesh.position.y <-200){
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game && game.status=="waitingReplay"){

  }


  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  sea.mesh.rotation.z += game.speed*deltaTime;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  if (game && game.cameraFov) {
      camera.fov = game.cameraFov;
      camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  
  updateDebugPanel();

  requestAnimationFrame(loop);
}

function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);
}
var blinkEnergy=false;
function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";
  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }
  if (game.energy <1){
    game.status = "gameover";
  }
}
function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}
function removeEnergy(multiplier){
  // 默认值为 1
  if (multiplier === undefined) multiplier = 1;
  game.energy -= game.ennemyValue * multiplier;
  game.energy = Math.max(0, game.energy);
}
function updatePlane(){
  game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);
  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;
  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;
  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*game.planeMoveSensivity;
  airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*deltaTime*game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  
  camera.position.y += (airplane.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;
  game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
  game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;
  airplane.pilot.updateHairs();
}
function showReplay(){
  replayMessage.style.display="block";
}
function hideReplay(){
  replayMessage.style.display="none";
}
function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;
// 调试面板变量
var debugPanel;
// 暂停菜单变量
var pauseScreen;

function init(event){

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();
  createProjectiles();
  
  createDebugPanel();
  createPauseScreen();
  // 【新增】：创建奖励关UI
  createBonusUI();

  game.status = "waitingReplay";
  showReplay();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('keydown', handleKeyDown, false);

  loop();
}

function createDebugPanel() {
    debugPanel = document.createElement('div');
    debugPanel.style.position = 'absolute';
    debugPanel.style.top = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugPanel.style.color = '#ffffff';
    debugPanel.style.padding = '10px';
    debugPanel.style.fontFamily = 'monospace'; 
    debugPanel.style.fontSize = '14px';
    debugPanel.style.zIndex = '1000'; 
    debugPanel.style.pointerEvents = 'none'; 
    
    document.body.appendChild(debugPanel);
}

function updateDebugPanel() {
    if (!debugPanel || !game) return;
    var speedVal = game.targetBaseSpeed ? game.targetBaseSpeed.toFixed(6) : 0;
    var densityVal = game.distanceForEnnemiesSpawn;
    var fogNearVal = (scene && scene.fog) ? scene.fog.near : 0;
    var fogFarVal = (scene && scene.fog) ? scene.fog.far : 0;
    var lightVal = hemisphereLight ? hemisphereLight.intensity.toFixed(2) : 0;
    var fovVal = game.cameraFov ? game.cameraFov : 60; // 显示 FOV

    debugPanel.innerHTML = 
        "Speed (速度): " + speedVal + "<br>" +
        "Density (障碍间距): " + densityVal + "<br>" +
        "Fog Near (雾起始): " + fogNearVal + "<br>" +
        "Fog Far (雾结束): " + fogFarVal + "<br>" +
        "Light (光照): " + lightVal + "<br>" +
        "FOV (视野): " + fovVal;
}

function createPauseScreen() {
    pauseScreen = document.createElement('div');
    pauseScreen.style.position = 'absolute';
    pauseScreen.style.top = '0';
    pauseScreen.style.left = '0';
    pauseScreen.style.width = '100%';
    pauseScreen.style.height = '100%';
    pauseScreen.style.backgroundColor = 'rgba(242, 83, 70, 0.8)'; 
    pauseScreen.style.display = 'none'; 
    pauseScreen.style.flexDirection = 'column';
    pauseScreen.style.justifyContent = 'center';
    pauseScreen.style.alignItems = 'center';
    pauseScreen.style.zIndex = '2000'; 

    var title = document.createElement('h1');
    title.innerHTML = "GAME PAUSED";
    title.style.color = '#ffffff';
    title.style.fontFamily = 'monospace';
    title.style.fontSize = '40px';
    title.style.letterSpacing = '5px';
    title.style.marginBottom = '30px';
    title.style.userSelect = 'none';
    pauseScreen.appendChild(title);

    var btnStyle = "margin: 10px; padding: 15px 40px; background: #ffffff; color: #f25346; font-family: monospace; font-size: 18px; cursor: pointer; border-radius: 5px; user-select: none; text-transform: uppercase; border: none;";

    var btnResume = document.createElement('div');
    btnResume.innerHTML = "CONTINUE";
    btnResume.style.cssText = btnStyle;
    btnResume.onmouseover = function() { this.style.backgroundColor = '#d8d0d1'; };
    btnResume.onmouseout = function() { this.style.backgroundColor = '#ffffff'; };
    btnResume.onclick = function() { togglePause(); };
    pauseScreen.appendChild(btnResume);

    var btnRestart = document.createElement('div');
    btnRestart.innerHTML = "RESTART";
    btnRestart.style.cssText = btnStyle;
    btnRestart.onmouseover = function() { this.style.backgroundColor = '#d8d0d1'; };
    btnRestart.onmouseout = function() { this.style.backgroundColor = '#ffffff'; };
    btnRestart.onclick = function() { 
        resetGame(); 
        hidePause();
        oldTime = new Date().getTime();
    };
    pauseScreen.appendChild(btnRestart);

    document.body.appendChild(pauseScreen);
}

function togglePause() {
    if (game.status == "playing") {
        game.status = "paused";
        showPause();
    } else if (game.status == "paused") {
        game.status = "playing";
        hidePause();
        oldTime = new Date().getTime();
    }
}

function showPause() {
    pauseScreen.style.display = 'flex';
}

function hidePause() {
    pauseScreen.style.display = 'none';
}

function handleKeyDown(event) {
    if (event.key === "Escape") {
        if (game.status == "playing" || game.status == "paused") {
            togglePause();
        }
    }
}

function connectToPython() {
    var socket = new WebSocket("ws://localhost:8765");
    socket.onopen = function(e) {
        console.log("已连接到 Python 控制器");
    };
    socket.onmessage = function(event) {
        if (!game) return;
        var data = JSON.parse(event.data);
        console.log("收到参数更新:", data);
        if (data.speed !== undefined) {
            game.targetBaseSpeed = data.speed;
        }
        if (data.density !== undefined) {
            game.distanceForEnnemiesSpawn = data.density;
            game.distanceForCoinsSpawn = data.density * 2.5;
        }
        if (scene && scene.fog) {
            if (data.fog_near !== undefined) scene.fog.near = data.fog_near;
            if (data.fog_far !== undefined) scene.fog.far = data.fog_far;
        }
        if (hemisphereLight) {
            if (data.light_intensity !== undefined) {
                hemisphereLight.intensity = data.light_intensity;
            }
        }
        if (data.fov !== undefined) {
            game.cameraFov = data.fov;
        }
    };
    socket.onclose = function(event) {
        console.log("连接断开，1秒后重连...");
        setTimeout(connectToPython, 1000);
    };
    socket.onerror = function(error) {
        console.log("WebSocket 错误: " + error.message);
    };
}

connectToPython();

window.addEventListener('load', init, false);