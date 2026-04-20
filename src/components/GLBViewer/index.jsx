import { Component } from 'react';
import { Canvas } from '@tarojs/components';

/**
 * GLB 3D模型查看器组件
 * 
 * @param {string} modelUrl - GLB模型的URL地址
 * @param {number} width - 画布宽度（rpx）
 * @param {number} height - 画布高度（rpx）
 * @param {boolean} autoRotate - 是否自动旋转，默认true
 * @param {number} rotationSpeed - 旋转速度，默认0.01
 * @param {number} cameraZ - 相机Z轴位置，默认5
 * @param {number} cameraY - 相机Y轴位置，默认1
 * @param {number} backgroundColor - 背景颜色，默认transparent（透明）
 * @param {number} initialRotationX - 模型初始X轴旋转角度，默认0
 * @param {number} initialRotationY - 模型初始Y轴旋转角度，默认0
 * @param {number} initialRotationZ - 模型初始Z轴旋转角度，默认0
 * @param {boolean} useWhiteMaterial - 是否使用白色基础材质替换原材质，默认false
 * @param {number} positionOffsetX - 模型X轴位置偏移，默认0
 * @param {number} positionOffsetY - 模型Y轴位置偏移，默认0
 * @param {number} positionOffsetZ - 模型Z轴位置偏移，默认0
 * @param {number} lightIntensityMultiplier - 光照强度倍数，默认1.0
 * @param {number} exposureMultiplier - 曝光度倍数，默认1.0
 * @param {function} onLoad - 模型加载成功回调
 * @param {function} onError - 模型加载失败回调
 */
export default class GLBViewer extends Component {
  static defaultProps = {
    width: '100%',
    height: '500px',
    autoRotate: true,
    rotationSpeed: 0.01,
    // 相机距离会根据模型大小自动调整
    cameraZ: 5,
    cameraY: 0,
    backgroundColor: null, // 默认透明背景
    initialRotationX: 0,
    initialRotationY: 0,
    initialRotationZ: 0,
    useWhiteMaterial: false, // 是否使用白色材质
    positionOffsetX: 0, // X轴位置偏移
    positionOffsetY: 0, // Y轴位置偏移
    positionOffsetZ: 0, // Z轴位置偏移
    lightIntensityMultiplier: 1.0, // 光照强度倍数
    exposureMultiplier: 1.0, // 曝光度倍数
    debug: false, // Debug mode
    onLoad: null,
    onError: null
  };

  constructor(props) {
    super(props);
    // 在构造函数中生成唯一ID
    this.canvasId = `glb-canvas-${Math.random().toString(36).substring(2, 11)}`;
    
    // Touch interaction state
    this.isDragging = false;
    this.lastTouchX = 0;
    this.lastTouchDistance = 0;
    this.isUserInteracting = false;
  }

  handleTouchStart = (e) => {
    this.isUserInteracting = true;
    const touches = e.touches;
    if (touches.length === 1) {
      this.isDragging = true;
      this.lastTouchX = touches[0].x;
    } else if (touches.length === 2) {
      this.isDragging = true;
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  handleTouchMove = (e) => {
    if (!this.isDragging || !this.model) return;
    
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Rotate
      const deltaX = touches[0].x - this.lastTouchX;
      this.lastTouchX = touches[0].x;
      
      // Adjust rotation sensitivity
      this.model.rotation.y += deltaX * 0.01;
    } else if (touches.length === 2) {
      // Zoom (Pinch)
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (this.lastTouchDistance > 0) {
        const delta = distance - this.lastTouchDistance;
        
        // Move camera Z to zoom in/out
        // delta > 0 -> distance increasing -> zoom in (reduce Z)
        // delta < 0 -> distance decreasing -> zoom out (increase Z)
        
        let newZ = this.camera.position.z - delta * 0.01;
        
        // Clamp zoom range - extended range for tiny/large models
        newZ = Math.max(1, Math.min(newZ, 30));
        this.camera.position.z = newZ;
      }
      this.lastTouchDistance = distance;
    }
  };

  handleTouchEnd = () => {
    this.isDragging = false;
    this.lastTouchDistance = 0;
    
    // Resume auto-rotation after a short delay if desired, or keep it paused
    // For now, we'll keep it paused while user interacts, and maybe resume?
    // User requirement doesn't specify, but usually "interaction" implies taking control.
    // We will set isUserInteracting to false to allow autoRotate to resume if desired.
    // Or we can leave it true to stop auto-rotation permanently after interaction.
    // Let's make it resume after interaction ends.
    this.isUserInteracting = false;
  };

  componentDidMount() {
    console.log('GLBViewer mounted, canvasId:', this.canvasId);
    this.initScene();
  }

  componentWillUnmount() {
    console.log('GLBViewer unmounting, cleaning up...');
    this.stopAnimation();
    this.cleanupScene();
  }

  stopAnimation = () => {
    if (this.frameId) {
      if (this.renderer && this.renderer.domElement) {
        const canvas = this.renderer.domElement;
        if (canvas.cancelAnimationFrame) {
          canvas.cancelAnimationFrame(this.frameId);
        }
      }
      this.frameId = null;
    }
  };

  cleanupScene = () => {
    // 清理模型
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      if (this.scene) {
        this.scene.remove(this.model);
      }
      this.model = null;
    }

    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    // 清理场景
    if (this.scene) {
      this.scene = null;
    }

    // 清理相机
    if (this.camera) {
      this.camera = null;
    }
  };

  initScene = () => {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select(`#${this.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          console.log('Query result for', this.canvasId, ':', res);
          if (!res || !res[0] || !res[0].node) {
            console.error('Canvas not found, retrying...');
            setTimeout(this.initScene, 500);
            return;
          }

          const canvas = res[0].node;
          const { width, height } = res[0];

          this.setupThreeJS(canvas, width, height);
        });
    }, 100);
  };

  setupThreeJS = (canvas, width, height) => {
    try {
      const THREE = require('threejs-miniprogram');
      
      if (THREE.createScopedThreejs) {
        const scopedTHREE = THREE.createScopedThreejs(canvas);
        this.initWithTHREE(scopedTHREE, canvas, width, height);
      } else {
        this.initWithTHREE(THREE, canvas, width, height);
      }
    } catch (error) {
      console.error('Setup error:', error);
      if (this.props.onError) {
        this.props.onError(error);
      }
    }
  };

  initWithTHREE = (THREE, canvas, width, height) => {
    try {
      this.THREE = THREE;

      const info = wx.getSystemInfoSync();
      const dpr = info.pixelRatio || 2;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // 创建场景
      const scene = new THREE.Scene();
      // 只有指定背景色时才设置，否则透明
      if (this.props.backgroundColor !== null && this.props.backgroundColor !== undefined) {
        scene.background = new THREE.Color(this.props.backgroundColor);
      }
      this.scene = scene;

      // 创建相机 - 调整为平视角度
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.z = this.props.cameraZ;
      camera.position.y = this.props.cameraY;
      camera.position.x = 0; // 确保X轴居中
      camera.lookAt(0, 0, 0); // 看向场景中心
      this.camera = camera;

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0); // 透明背景
      
      // 启用色调映射和物理正确的光照
      // 应用曝光度倍数
      const exposureMultiplier = this.props.exposureMultiplier || 1.0;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0 * exposureMultiplier;
      renderer.outputEncoding = THREE.sRGBEncoding;
      
      this.renderer = renderer;

      // 平衡的光照设置 - 适配各种材质的模型
      // 应用光照强度倍数
      const lightMultiplier = this.props.lightIntensityMultiplier || 1.0;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8 * lightMultiplier);
      scene.add(ambientLight);
      this.ambientLight = ambientLight;

      // Key Light (Main source)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.0 * lightMultiplier);
      keyLight.position.set(5, 5, 5);
      scene.add(keyLight);
      this.keyLight = keyLight;

      // Fill Light (Front)
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6 * lightMultiplier);
      fillLight.position.set(-3, 0, 5);
      scene.add(fillLight);
      this.fillLight = fillLight;
      
      // Rim Light (Back)
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8 * lightMultiplier);
      rimLight.position.set(0, 3, -5);
      scene.add(rimLight);
      this.rimLight = rimLight;

      // 首次渲染
      renderer.render(scene, camera);

      // 加载模型
      if (this.props.modelUrl) {
        this.loadModel(THREE);
      }
    } catch (error) {
      console.error('Init error:', error);
      if (this.props.onError) {
        this.props.onError(error);
      }
    }
  };

  loadModel = (THREE) => {
    // 清理旧模型（如果存在）
    if (this.model && this.scene) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.scene.remove(this.model);
      this.model = null;
    }

    const { modelUrl, onLoad, onError } = this.props;

    const { GLBLoader } = require('../../utils/GLBLoader');
    const loader = new GLBLoader(THREE);

    loader.load(
      modelUrl,
      (gltf) => {
        console.log('GLB loaded');

        const model = gltf.scene;

        // Ensure matrix world is updated before box calculation
        model.updateMatrixWorld(true);

        // Calculate bounding box from Meshes only to avoid stray empty objects
        const box = new this.THREE.Box3();
        let hasMeshes = false;

        model.traverse((child) => {
            // 检查是否是Mesh（使用更宽松的条件）
            const isMesh = child.isMesh || (child.geometry && child.material);
            
            if (isMesh) {
                console.log('Found mesh:', child, 'useWhiteMaterial:', this.props.useWhiteMaterial);
                
                // 如果启用白色材质模式，替换为白色基础材质
                if (this.props.useWhiteMaterial) {
                    console.log('Replacing material with white material for mesh:', child.name || 'unnamed');
                    
                    // 检查并修复法线
                    if (child.geometry) {
                        // 如果没有法线，计算法线
                        if (!child.geometry.attributes.normal) {
                            console.log('Computing normals for geometry');
                            child.geometry.computeVertexNormals();
                        }
                        
                        // 确保法线属性存在且正确
                        if (child.geometry.attributes.normal) {
                            child.geometry.attributes.normal.needsUpdate = true;
                        }
                    }
                    
                    const whiteMaterial = new this.THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.5,
                        metalness: 0.1,
                        side: this.THREE.DoubleSide,
                        flatShading: false,
                        emissive: 0x222222,  // 添加自发光，确保即使没有光照也能看到
                        emissiveIntensity: 0.3
                    });
                    
                    // 处理材质数组的情况
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(() => whiteMaterial.clone());
                    } else {
                        child.material = whiteMaterial;
                    }
                    
                    // 强制更新
                    child.material.needsUpdate = true;
                    if (child.geometry) {
                        child.geometry.computeBoundingSphere();
                        child.geometry.computeBoundingBox();
                    }
                    
                    console.log('Material replaced, new material color:', child.material.color);
                } else {
                    // 保持材质原有属性，只做必要调整
                    if (child.material) {
                        child.material.side = this.THREE.DoubleSide;
                        
                        // 保留原始材质属性，不做过度修改
                        if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                            // 只对极暗的材质做轻微提亮
                            if (child.material.color) {
                                const brightness = (child.material.color.r + child.material.color.g + child.material.color.b) / 3;
                                console.log('Material brightness:', brightness, 'color:', child.material.color);
                                if (brightness < 0.15) {
                                    // 只对非常暗的材质提亮15%
                                    child.material.color.multiplyScalar(1.15);
                                }
                            }
                        }
                        
                        child.material.needsUpdate = true;
                    }
                }
                
                // Expand box by this mesh
                box.expandByObject(child);
                hasMeshes = true;
            }
        });

        // Fallback to full object if no meshes found (unlikely)
        if (!hasMeshes) {
            box.setFromObject(model);
        }

        const size = box.getSize(new this.THREE.Vector3());
        const center = box.getCenter(new this.THREE.Vector3());

        console.log('Model Size:', size);
        console.log('Model Center:', center);

        // Center the model and apply offsets
        model.position.x = -center.x + (this.props.positionOffsetX || 0);
        model.position.y = -center.y + (this.props.positionOffsetY || 0);
        model.position.z = -center.z + (this.props.positionOffsetZ || 0);

        // 自动缩放 - Auto scale
        const maxDim = Math.max(size.x, size.y, size.z);
        // Avoid division by zero
        if (maxDim > 0) {
            // 目标尺寸设置为5，让模型占据更多视野空间
            const targetSize = 5;
            const scale = targetSize / maxDim;
            model.scale.set(scale, scale, scale);
            console.log('Model dimensions:', size);
            console.log('Max dimension:', maxDim);
            console.log('Applied Scale:', scale);
            
            // 根据模型大小动态调整相机距离
            // 较小的模型需要相机更近，较大的模型需要相机更远
            const optimalDistance = targetSize * 1.5; // 1.5倍目标尺寸作为最佳观察距离
            this.camera.position.z = optimalDistance;
            this.camera.position.y = 0; // 平视角度
            this.camera.lookAt(0, 0, 0);
            
            console.log('Camera distance set to:', optimalDistance);
        } else {
            console.warn('Model has zero size, skipping auto-scale');
        }

        // 设置模型初始旋转角度
        model.rotation.x = this.props.initialRotationX;
        model.rotation.y = this.props.initialRotationY;
        model.rotation.z = this.props.initialRotationZ;

        this.scene.add(model);
        this.model = model;

        // Debug helpers
        if (this.props.debug) {
            // Axes helper (Red=X, Green=Y, Blue=Z)
            const axesHelper = new this.THREE.AxesHelper(5);
            this.scene.add(axesHelper);

            // Box helper for the model
            const boxHelper = new this.THREE.BoxHelper(model, 0xffff00);
            this.scene.add(boxHelper);
            console.log('Debug mode: Added AxesHelper and BoxHelper');
        }

        // 启动动画
        this.startAnimation();

        if (onLoad) {
          onLoad(gltf);
        }
      },
      null,
      (error) => {
        console.error('GLB load error:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  };

  startAnimation = () => {
    // 先停止旧的动画循环
    this.stopAnimation();
    
    const canvas = this.renderer.domElement;
    const { autoRotate, rotationSpeed } = this.props;

    const animate = () => {
      // 检查组件是否已卸载
      if (!this.renderer || !this.scene || !this.camera) {
        return;
      }

      this.frameId = canvas.requestAnimationFrame(animate);

      if (autoRotate && this.model && !this.isUserInteracting) {
        // 沿水平轴（Y轴）旋转，实现水平旋转效果
        this.model.rotation.y += rotationSpeed;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  };

  render() {
    const { width, height, backgroundColor } = this.props;
    
    // 将十六进制颜色转换为 CSS 颜色
    const bgColor = backgroundColor !== null && backgroundColor !== undefined
      ? `#${backgroundColor.toString(16).padStart(6, '0')}`
      : 'transparent';

    return (
      <Canvas
        type="webgl"
        id={this.canvasId}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
        style={{
          width,
          height,
          display: 'block',
          backgroundColor: bgColor
        }}
      />
    );
  }
}
