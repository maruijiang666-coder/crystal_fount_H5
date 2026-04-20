/**
 * 简化的 GLB 加载器，用于小程序环境
 * 基于 glTF 2.0 规范
 */

// Polyfill for TextDecoder if not available
class PolyfillTextDecoder {
  decode(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte < 128) {
        str += String.fromCharCode(byte);
      } else if ((byte & 0xe0) === 0xc0) {
        str += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[++i] & 0x3f));
      } else if ((byte & 0xf0) === 0xe0) {
        str += String.fromCharCode(
          ((byte & 0x0f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f)
        );
      } else if ((byte & 0xf8) === 0xf0) {
        const codePoint =
          ((byte & 0x07) << 18) |
          ((bytes[++i] & 0x3f) << 12) |
          ((bytes[++i] & 0x3f) << 6) |
          (bytes[++i] & 0x3f);
        if (codePoint > 0xffff) {
           const offset = codePoint - 0x10000;
           str += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
        } else {
           str += String.fromCharCode(codePoint);
        }
      }
    }
    return str;
  }
}

const MyTextDecoder = (typeof TextDecoder === 'undefined') ? PolyfillTextDecoder : TextDecoder;

export class GLBLoader {
  constructor(THREE) {
    this.THREE = THREE;
  }

  load(url, onLoad, onProgress, onError) {
    wx.request({
      url,
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const result = this.parse(res.data);
            if (onLoad) onLoad(result);
          } catch (error) {
            console.error('GLB parse error:', error);
            if (onError) onError(error);
          }
        } else {
          if (onError) onError(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (error) => {
        if (onError) onError(error);
      }
    });
  }

  parse(arrayBuffer) {
    const THREE = this.THREE;
    const dataView = new DataView(arrayBuffer);
    
    // 读取 GLB 头部
    const magic = dataView.getUint32(0, true);
    if (magic !== 0x46546C67) { // 'glTF'
      throw new Error('Invalid GLB file');
    }
    
    const version = dataView.getUint32(4, true);
    const length = dataView.getUint32(8, true);
    
    console.log('GLB version:', version, 'length:', length);
    
    // 读取 JSON chunk
    let offset = 12;
    const jsonChunkLength = dataView.getUint32(offset, true);
    const jsonChunkType = dataView.getUint32(offset + 4, true);
    
    if (jsonChunkType !== 0x4E4F534A) { // 'JSON'
      throw new Error('Invalid JSON chunk');
    }
    
    const jsonData = new Uint8Array(arrayBuffer, offset + 8, jsonChunkLength);
    const jsonText = new MyTextDecoder().decode(jsonData);
    const gltf = JSON.parse(jsonText);
    
    console.log('GLTF data:', gltf);
    
    // 读取 BIN chunk (如果存在)
    offset += 8 + jsonChunkLength;
    let bufferData = null;
    
    if (offset < length) {
      const binChunkLength = dataView.getUint32(offset, true);
      const binChunkType = dataView.getUint32(offset + 4, true);
      
      if (binChunkType === 0x004E4942) { // 'BIN\0'
        bufferData = new Uint8Array(arrayBuffer, offset + 8, binChunkLength);
        console.log('Binary data length:', binChunkLength);
      }
    }
    
    // 解析场景
    const scene = this.parseScene(gltf, bufferData);
    
    return {
      scene,
      scenes: [scene],
      animations: [],
      asset: gltf.asset
    };
  }

  parseScene(gltf, bufferData) {
    const THREE = this.THREE;
    const scene = new THREE.Group();
    
    if (!gltf.scenes || gltf.scenes.length === 0) {
      console.warn('No scenes found in GLTF');
      return scene;
    }
    
    const sceneDef = gltf.scenes[gltf.scene || 0];
    if (sceneDef.nodes) {
      sceneDef.nodes.forEach(nodeIndex => {
        const node = this.parseNode(gltf, nodeIndex, bufferData);
        if (node) scene.add(node);
      });
    }
    
    return scene;
  }

  parseNode(gltf, nodeIndex, bufferData) {
    const THREE = this.THREE;
    const nodeDef = gltf.nodes[nodeIndex];
    const group = new THREE.Group();
    
    if (nodeDef.name) group.name = nodeDef.name;
    
    if (nodeDef.matrix) {
      group.matrix.fromArray(nodeDef.matrix);
      group.matrix.decompose(group.position, group.quaternion, group.scale);
    } else {
      if (nodeDef.translation) group.position.fromArray(nodeDef.translation);
      if (nodeDef.rotation) group.quaternion.fromArray(nodeDef.rotation);
      if (nodeDef.scale) group.scale.fromArray(nodeDef.scale);
    }
    
    if (nodeDef.mesh !== undefined) {
      const meshDef = gltf.meshes[nodeDef.mesh];
      meshDef.primitives.forEach(primitive => {
        try {
          const geometry = this.parsePrimitive(gltf, primitive, bufferData);
          const material = this.parseMaterial(gltf, primitive.material);
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        } catch (e) {
          console.error('Error parsing primitive:', e);
        }
      });
    }
    
    if (nodeDef.children) {
      nodeDef.children.forEach(childIndex => {
        const childNode = this.parseNode(gltf, childIndex, bufferData);
        if (childNode) group.add(childNode);
      });
    }
    
    return group;
  }

  parsePrimitive(gltf, primitive, bufferData) {
    const THREE = this.THREE;
    const geometry = new THREE.BufferGeometry();
    
    // 解析顶点属性
    for (const [attrName, accessorIndex] of Object.entries(primitive.attributes)) {
      const accessor = gltf.accessors[accessorIndex];
      const bufferView = gltf.bufferViews[accessor.bufferView];
      
      const data = this.getAccessorData(accessor, bufferView, bufferData);
      
      // threejs-miniprogram 使用旧版 API
      if (attrName === 'POSITION') {
        geometry.addAttribute('position', new THREE.BufferAttribute(data, 3));
      } else if (attrName === 'NORMAL') {
        geometry.addAttribute('normal', new THREE.BufferAttribute(data, 3));
      } else if (attrName === 'TEXCOORD_0') {
        geometry.addAttribute('uv', new THREE.BufferAttribute(data, 2));
      }
    }
    
    // 解析索引
    if (primitive.indices !== undefined) {
      const accessor = gltf.accessors[primitive.indices];
      const bufferView = gltf.bufferViews[accessor.bufferView];
      const indices = this.getAccessorData(accessor, bufferView, bufferData);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    
    return geometry;
  }

  getAccessorData(accessor, bufferView, bufferData) {
    const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const length = accessor.count * this.getComponentCount(accessor.type);
    
    const TypedArray = this.getTypedArray(accessor.componentType);
    const data = new TypedArray(
      bufferData.buffer,
      bufferData.byteOffset + offset,
      length
    );
    
    return data;
  }

  getComponentCount(type) {
    const counts = {
      'SCALAR': 1,
      'VEC2': 2,
      'VEC3': 3,
      'VEC4': 4,
      'MAT2': 4,
      'MAT3': 9,
      'MAT4': 16
    };
    return counts[type] || 1;
  }

  getTypedArray(componentType) {
    const types = {
      5120: Int8Array,
      5121: Uint8Array,
      5122: Int16Array,
      5123: Uint16Array,
      5125: Uint32Array,
      5126: Float32Array
    };
    return types[componentType] || Float32Array;
  }

  parseMaterial(gltf, materialIndex) {
    const THREE = this.THREE;
    
    if (materialIndex === undefined || !gltf.materials) {
      return new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.5,
        roughness: 0.5
      });
    }
    
    const materialDef = gltf.materials[materialIndex];
    const pbr = materialDef.pbrMetallicRoughness || {};
    
    const material = new THREE.MeshStandardMaterial({
      color: pbr.baseColorFactor ? 
        new THREE.Color(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2]) :
        0xcccccc,
      metalness: pbr.metallicFactor !== undefined ? pbr.metallicFactor : 0.5,
      roughness: pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 0.5
    });
    
    return material;
  }
}
