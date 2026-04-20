// 全局配置工具

/**
 * 获取OSS基础URL
 * @returns {string} OSS基础URL
 */
export const getOssBaseUrl = () => {
  // 尝试从App实例获取全局数据
  if (typeof getApp === 'function') {
    try {
      const app = getApp();
      if (app && app.globalData && app.globalData.ossBaseUrl) {
        return app.globalData.ossBaseUrl;
      }
    } catch (e) {
      console.warn('无法从App实例获取全局数据');
    }
  }
  
  // 如果无法从App获取，使用默认的OSS地址
  return 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/';
};

/**
 * 获取完整OSS图片URL
 * @param {string} imagePath - 图片相对路径（如：SJSY/6cec6f7f5aa0f7ebd6a5481d215c5a83.png）
 * @returns {string} 完整图片URL
 */
export const getOssImageUrl = (imagePath) => {
  const baseUrl = getOssBaseUrl();
  if (!baseUrl || !imagePath) return '';
  
  // 移除路径开头的斜杠（如果有）
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const fullUrl = `${baseUrl}${cleanPath}`;
  
  // console.log('生成图片URL:', fullUrl);
  return fullUrl;
};

/**
 * 获取本地图片路径（用于require）
 * @param {string} imagePath - 图片相对路径
 * @returns {string} 本地图片路径
 */
export const getLocalImagePath = (imagePath) => {
  if (!imagePath) return '';
  
  // 移除路径开头的斜杠（如果有）
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `../../assets/${cleanPath}`;
};

/**
 * Three.js 小程序适配版本工具函数
 */

/**
 * 初始化Three.js场景
 * @param {Object} canvas - 小程序canvas对象
 * @param {Object} options - 配置选项
 * @returns {Object} Three.js核心对象 { THREE, scene, camera, renderer }
 */
export const initThreeJS = (canvas, options = {}) => {
  const {
    width = 300,
    height = 300,
    backgroundColor = 0x000000,
    cameraPosition = [0, 0, 4], // 调整为平视角度，Y轴设为0
    enableLights = true
  } = options;

  // 在小程序环境中，直接使用全局THREE
  const THREE = window.THREE || global.THREE;
  
  if (!THREE) {
    throw new Error('THREE is not available. Please ensure threejs-miniprogram is properly loaded.');
  }

  // 创建场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  // 创建相机
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(...cameraPosition);

  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });
  renderer.setSize(width, height);
  
  // 获取设备像素比
  let pixelRatio = 1;
  try {
    pixelRatio = wx.getSystemInfoSync().pixelRatio;
  } catch (e) {
    console.warn('无法获取设备像素比，使用默认值');
  }
  renderer.setPixelRatio(pixelRatio);

  // 添加灯光
  if (enableLights) {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
  }

  return {
    THREE,
    scene,
    camera,
    renderer
  };
};

/**
 * 加载GLTF模型
 * @param {Object} THREE - Three.js对象
 * @param {string} modelPath - 模型文件路径
 * @returns {Promise} 模型加载Promise
 */
export const loadGLTFModel = async (THREE, modelUrl) => {
  console.log('加载GLTF模型:', modelUrl);
  
  // 检查 GLTFLoader 是否可用
  if (!THREE.GLTFLoader) {
    console.error('GLTFLoader 不可用，请确保已正确引入 threejs-miniprogram');
    throw new Error('GLTFLoader not available');
  }
  
  try {
    return new Promise((resolve, reject) => {
      // 使用 wx.request 加载文件（小程序环境）
      if (typeof wx !== 'undefined' && wx.request) {
        wx.request({
          url: modelUrl,
          responseType: 'arraybuffer',
          success: (res) => {
            console.log('模型文件请求成功，状态:', res.statusCode);
            if (res.statusCode === 200) {
              try {
                const loader = new THREE.GLTFLoader();
                loader.parse(res.data, '', function(gltf) {
                  console.log('GLTF模型解析成功:', gltf);
                  resolve(gltf);
                }, function(error) {
                  console.error('GLTF解析失败:', error);
                  reject(error);
                });
              } catch (error) {
                console.error('GLTF处理失败:', error);
                reject(error);
              }
            } else {
              reject(new Error(`加载失败: ${res.statusCode}`));
            }
          },
          fail: (error) => {
            console.error('wx.request 失败:', error);
            reject(error);
          }
        });
      } else {
        // 非小程序环境，使用 XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('GET', modelUrl, true);
        xhr.responseType = 'arraybuffer';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const loader = new THREE.GLTFLoader();
              loader.parse(xhr.response, '', function(gltf) {
                console.log('GLTF模型加载成功:', gltf);
                resolve(gltf);
              }, function(error) {
                console.error('GLTF解析失败:', error);
                reject(error);
              });
            } catch (error) {
              console.error('GLTF处理失败:', error);
              reject(error);
            }
          } else {
            reject(new Error(`加载失败: ${xhr.status}`));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('网络请求失败'));
        };
        
        xhr.send();
      }
    });
  } catch (error) {
    console.error('GLTF模型加载失败:', error);
    throw error;
  }
};

/**
 * 创建简单的3D对象
 * @param {Object} THREE - Three.js对象
 * @param {string} type - 对象类型 ('box', 'sphere', 'cylinder', etc.)
 * @param {Object} params - 对象参数
 * @param {number} params.width - 宽度
 * @param {number} params.height - 高度
 * @param {number} params.depth - 深度
 * @param {number} params.radius - 半径
 * @param {number} params.color - 颜色
 * @returns {Object} 3D对象
 */
export const create3DObject = (THREE, type, options = {}) => {
  try {
    let geometry, material, mesh;
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          options.width || 1,
          options.height || 1,
          options.depth || 1
        );
        break;
        
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          options.radius || 0.5,
          options.widthSegments || 32,
          options.heightSegments || 16
        );
        break;
        
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          options.radius || 0.5,
          options.radius || 0.5,
          options.height || 1,
          options.radialSegments || 32
        );
        break;
        
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    material = new THREE.MeshLambertMaterial({
      color: options.color || 0x4a90e2,
      wireframe: options.wireframe || false
    });
    
    mesh = new THREE.Mesh(geometry, material);
    return mesh;
    
  } catch (error) {
    console.error('创建3D对象失败:', error);
    return null;
  }
};

// 加载3D模型（简化版，仅支持基础几何体）
export const load3DModel = (THREE, modelPath) => {
  console.log('加载3D模型:', modelPath);
  try {
    // 简化版本：根据模型路径创建对应的几何体
    let geometry, material, mesh;
    
    if (modelPath.includes('cube') || modelPath.includes('box')) {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    } else if (modelPath.includes('sphere')) {
      geometry = new THREE.SphereGeometry(0.5, 32, 16);
    } else if (modelPath.includes('cylinder')) {
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    } else {
      // 默认创建复杂一点的组合几何体
      const group = new THREE.Group();
      
      // 主体
      const mainGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
      const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
      group.add(mainMesh);
      
      // 顶部装饰
      const topGeometry = new THREE.SphereGeometry(0.3, 16, 8);
      const topMaterial = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.position.y = 0.8;
      group.add(topMesh);
      
      return group;
    }
    
    material = new THREE.MeshLambertMaterial({
      color: 0x4a90e2,
      wireframe: false
    });
    
    mesh = new THREE.Mesh(geometry, material);
    return mesh;
    
  } catch (error) {
    console.error('加载3D模型失败:', error);
    return null;
  }
};

export default {
  getOssBaseUrl,
  getOssImageUrl,
  getLocalImagePath,
  initThreeJS,
  loadGLTFModel,
  create3DObject
};