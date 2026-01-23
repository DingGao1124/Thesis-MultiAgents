import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import './RobotArmAnimator.css';

const RobotArmAnimator = ({ 
  scene, 
  onClose,
  joints: externalJoints,
  setJoints: externalSetJoints,
  followerObjects: externalFollowers,
  setFollowerObjects: externalSetFollowers,
  autoPlay = false, // 🎬 是否自动播放
  onPlaybackComplete = null, // 🎬 播放完成回调
  initialConfig = null, // 🎬 初始配置（用于程序化加载）
  showUI = true // 🔇 是否显示 UI 窗口（默认显示）
}) => {
  // console.log("🎬 RobotArmAnimator 组件渲染，props:", {
  //   autoPlay,
  //   hasOnPlaybackComplete: !!onPlaybackComplete,
  //   onPlaybackCompleteType: typeof onPlaybackComplete,
  //   hasInitialConfig: !!initialConfig,
  //   showUI
  // });
  const [joints, setJoints] = useState(externalJoints || []);
  const [selectedJointIndex, setSelectedJointIndex] = useState(null);
  
  // 时间轴动画相关状态
  const [timeline, setTimeline] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopAnimation, setLoopAnimation] = useState(false);
  const [animationMode, setAnimationMode] = useState('manual'); // 'manual' 或 'timeline'
  
  // 渐进式动作编辑器状态
  const [actionGroups, setActionGroups] = useState([]); // 保存的动作组列表
  const [currentActionTime, setCurrentActionTime] = useState(0); // 当前累计时间
  const [actionDuration, setActionDuration] = useState(2); // 每个动作的持续时间（秒）
  const [actionDescription, setActionDescription] = useState(''); // 当前动作描述
  const [executionOrder, setExecutionOrder] = useState('simultaneous'); // 执行顺序：'simultaneous'同时, 'forward'正向, 'reverse'反向
  
  // 🎯 动作组中的物体吸附配置
  const [enableFollowerInAction, setEnableFollowerInAction] = useState(false); // 是否在本动作组启用物体吸附
  const [followerNodeName, setFollowerNodeName] = useState(''); // 吸附的物体节点名称
  const [followerTargetJointId, setFollowerTargetJointId] = useState(''); // 吸附的目标关节ID
  const [followerOffset, setFollowerOffset] = useState({ x: 0, y: 0, z: 0 }); // 目标偏移量
  const [followerTransitionDuration, setFollowerTransitionDuration] = useState(0); // 过渡时长（秒）
  
  // 🎯 跟随物体状态
  const [followerObjects, setFollowerObjects] = useState(externalFollowers || []); // 跟随物体列表

  // 同步外部状态
  useEffect(() => {
    if (externalJoints) {
      setJoints(externalJoints);
    }
  }, [externalJoints]);

  useEffect(() => {
    if (externalFollowers) {
      setFollowerObjects(externalFollowers);
    }
  }, [externalFollowers]);

  // 包装setJoints以同步到外部
  const updateJoints = (newJoints) => {
    if (typeof newJoints === 'function') {
      setJoints(prev => {
        const updated = newJoints(prev);
        if (externalSetJoints) externalSetJoints(updated);
        return updated;
      });
    } else {
      setJoints(newJoints);
      if (externalSetJoints) externalSetJoints(newJoints);
    }
  };

  // 包装setFollowerObjects以同步到外部
  const updateFollowerObjects = (newFollowers) => {
    if (typeof newFollowers === 'function') {
      setFollowerObjects(prev => {
        const updated = newFollowers(prev);
        if (externalSetFollowers) externalSetFollowers(updated);
        return updated;
      });
    } else {
      setFollowerObjects(newFollowers);
      if (externalSetFollowers) externalSetFollowers(newFollowers);
    }
  };

  // 🔧 使用 ref 存储回调函数，避免依赖项变化导致无限循环
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  const hasCalledCompleteRef = useRef(false); // 🔧 防止重复调用完成回调
  
  useEffect(() => {
    onPlaybackCompleteRef.current = onPlaybackComplete;
  }, [onPlaybackComplete]);

  // 🔧 当配置变化时重置完成标志
  useEffect(() => {
    hasCalledCompleteRef.current = false;
  }, [timeline, autoPlay]);

  // 🎬 自动播放逻辑
  useEffect(() => {
    if (autoPlay && timeline.length > 0 && !isPlaying) {
      console.log("🎬 自动播放机器人动画...");
      setTimeout(() => {
        setIsPlaying(true);
      }, 500); // 延迟500ms确保配置已完全加载
    }
  }, [autoPlay, timeline, isPlaying]);

  // 🎬 播放完成检测
  useEffect(() => {
    if (isPlaying && timeline.length > 0) {
      const maxTime = Math.max(...timeline.map(t => t.time));
      // 减少日志输出，只在播放完成时输出
      // if (Math.floor(currentTime) !== Math.floor(currentTime - 0.016)) {
      //   console.log(`🕐 当前时间: ${currentTime.toFixed(2)}s / 最大时间: ${maxTime.toFixed(2)}s (${((currentTime/maxTime)*100).toFixed(1)}%)`);
      // }
      if (currentTime >= maxTime && !hasCalledCompleteRef.current) {
        console.log("🎬 机器人动画播放完成！");
        console.log("🎬 onPlaybackCompleteRef.current 类型:", typeof onPlaybackCompleteRef.current);
        hasCalledCompleteRef.current = true; // 🔧 标记已调用
        setIsPlaying(false);
        if (onPlaybackCompleteRef.current) {
          console.log("✅ 准备触发播放完成回调...");
          setTimeout(() => {
            console.log("🚀 正在执行播放完成回调...");
            onPlaybackCompleteRef.current();
            console.log("✅ 播放完成回调执行完毕");
          }, 100);
        } else {
          console.log("⚠️ 没有设置播放完成回调");
        }
      }
    }
  }, [currentTime, isPlaying, timeline]); // 🔧 移除 onPlaybackComplete 依赖

  // 添加新关节
  const addJoint = () => {
    const isBase = joints.length === 0;
    const newJoint = {
      id: Date.now(),
      name: isBase ? '底座 (Base)' : `关节 ${joints.length}`,
      type: isBase ? 'base' : 'joint',
      nodeName: '', // 用户输入的节点名称
      parentJointId: joints.length > 0 ? joints[joints.length - 1].id : null,
      // 关节位置（从绑定节点自动获取）
      position: { x: 0, y: 0, z: 0 },
      // 单轴旋转角度（度数）
      angle: 0,
      // 旋转轴（基于父子关节位置自动计算，或用户手动设置）
      rotationAxis: { x: 0, y: 1, z: 0 }, // 默认Y轴
      // 🔧 保存节点的初始旋转四元数（用于累加旋转）
      originalQuaternion: null,
      // 是否启用
      enabled: true
    };
    updateJoints([...joints, newJoint]);
  };

  // 计算旋转轴（基于父子关节位置）
  const calculateRotationAxis = (parentPos, childPos) => {
    const dx = childPos.x - parentPos.x;
    const dy = childPos.y - parentPos.y;
    const dz = childPos.z - parentPos.z;
    
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return { x: 0, y: 1, z: 0 }; // 默认Y轴
    
    // 归一化
    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  };

  // 根据节点名称查找并获取节点位置
  const getNodePositionByName = (nodeName) => {
    if (!scene || !nodeName) return null;
    
    let foundNode = null;
    scene.traverse((object) => {
      if (object.name === nodeName) {
        foundNode = object;
      }
    });
    
    if (foundNode) {
      const worldPos = new THREE.Vector3();
      foundNode.getWorldPosition(worldPos);
      return { x: worldPos.x, y: worldPos.y, z: worldPos.z };
    }
    
    return null;
  };

  // 更新关节节点名称并自动获取位置
  const updateJointNodeName = (jointId, nodeName) => {
    const position = getNodePositionByName(nodeName);
    
    // 🔧 查找节点并保存其初始旋转四元数
    let originalQuaternion = null;
    if (scene && nodeName) {
      scene.traverse((object) => {
        if (object.name === nodeName) {
          // 保存节点的初始旋转（克隆四元数）
          originalQuaternion = {
            x: object.quaternion.x,
            y: object.quaternion.y,
            z: object.quaternion.z,
            w: object.quaternion.w
          };
          console.log(`🔧 保存节点 "${nodeName}" 的初始旋转:`, originalQuaternion);
        }
      });
    }
    
    updateJoints(joints.map(joint => {
      if (joint.id === jointId) {
        const updatedJoint = {
          ...joint,
          nodeName: nodeName,
          position: position || joint.position,
          originalQuaternion: originalQuaternion || joint.originalQuaternion // 保存初始四元数
        };
        
        // 如果有父关节且获取到了位置，计算旋转轴
        if (joint.parentJointId && position) {
          const parentJoint = joints.find(j => j.id === joint.parentJointId);
          if (parentJoint && parentJoint.position) {
            updatedJoint.rotationAxis = calculateRotationAxis(parentJoint.position, position);
          }
        }
        
        return updatedJoint;
      }
      return joint;
    }));
  };

  // 删除关节
  const removeJoint = (jointId) => {
    // 不允许删除底座
    const jointToRemove = joints.find(j => j.id === jointId);
    if (jointToRemove && jointToRemove.type === 'base') {
      alert('不能删除底座！请先删除其他关节。');
      return;
    }
    
    const updatedJoints = joints.filter(j => j.id !== jointId);
    // 更新子关节的父关节引用
    updatedJoints.forEach(joint => {
      if (joint.parentJointId === jointId) {
        const parentIndex = joints.findIndex(j => j.id === jointId);
        if (parentIndex > 0) {
          joint.parentJointId = joints[parentIndex - 1].id;
        } else {
          joint.parentJointId = null;
        }
      }
    });
    updateJoints(updatedJoints);
  };


  // 更新关节旋转角度
  const updateJointAngle = (jointId, value) => {
    updateJoints(joints.map(joint => {
      if (joint.id === jointId) {
        return {
          ...joint,
          angle: parseFloat(value)
        };
      }
      return joint;
    }));
  };

  // 更新旋转轴
  const updateRotationAxis = (jointId, axis, value) => {
    updateJoints(joints.map(joint => {
      if (joint.id === jointId) {
        return {
          ...joint,
          rotationAxis: {
            ...joint.rotationAxis,
            [axis]: parseFloat(value)
          }
        };
      }
      return joint;
    }));
  };


  // 应用当前旋转到模型
  const applyRotation = () => {
    joints.forEach(joint => {
      if (!joint.nodeName || !joint.enabled) return;
      
      // 在场景中查找节点
      let nodeObject = null;
      scene.traverse((object) => {
        if (object.name === joint.nodeName) {
          nodeObject = object;
        }
      });
      
      if (!nodeObject) return;

      // 🔧 使用累加旋转：在原始旋转基础上应用角度调整
      const axis = new THREE.Vector3(
        joint.rotationAxis.x,
        joint.rotationAxis.y,
        joint.rotationAxis.z
      ).normalize();
      
      const angleRad = THREE.MathUtils.degToRad(joint.angle);
      const deltaQuaternion = new THREE.Quaternion();
      deltaQuaternion.setFromAxisAngle(axis, angleRad);
      
      // 如果有保存的初始旋转，则从初始旋转开始累加
      if (joint.originalQuaternion) {
        const originalQuat = new THREE.Quaternion(
          joint.originalQuaternion.x,
          joint.originalQuaternion.y,
          joint.originalQuaternion.z,
          joint.originalQuaternion.w
        );
        // 应用旋转：原始旋转 * 增量旋转
        nodeObject.quaternion.copy(originalQuat).multiply(deltaQuaternion);
      } else {
        // 如果没有保存初始旋转，直接设置（向后兼容旧配置）
        nodeObject.quaternion.copy(deltaQuaternion);
      }
    });
  };

  // 重置所有关节
  const resetRotation = () => {
    joints.forEach(joint => {
      if (!joint.nodeName) return;
      
      // 在场景中查找节点
      let nodeObject = null;
      scene.traverse((object) => {
        if (object.name === joint.nodeName) {
          nodeObject = object;
        }
      });
      
      if (!nodeObject) return;

      // 🔧 恢复到原始旋转状态（如果有保存）
      if (joint.originalQuaternion) {
        nodeObject.quaternion.set(
          joint.originalQuaternion.x,
          joint.originalQuaternion.y,
          joint.originalQuaternion.z,
          joint.originalQuaternion.w
        );
        console.log(`🔄 恢复节点 "${joint.nodeName}" 到原始旋转`);
      } else {
        // 如果没有保存初始旋转，重置为单位四元数（向后兼容）
        nodeObject.quaternion.identity();
      }
    });

    updateJoints(joints.map(joint => ({
      ...joint,
      angle: 0
    })));
  };

  // 实时应用旋转（每次角度改变时）
  useEffect(() => {
    applyRotation();
    applyFollowerAttachment(); // 同时更新跟随物体
  }, [joints]);

  // 🎯 过渡动画循环
  useEffect(() => {
    let lastTime = Date.now();
    let animationFrameId;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
      lastTime = currentTime;

      // 更新跟随物体过渡
      updateFollowerTransitions(deltaTime);

      // 应用跟随物体位置
      applyFollowerAttachment();

      animationFrameId = requestAnimationFrame(animate);
    };

    // 只有在有跟随物体时才启动动画循环
    if (followerObjects.length > 0) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [followerObjects]);

  // 🎯 添加跟随物体
  const addFollowerObject = (nodeName, targetJointId, transitionDuration = 0, targetOffset = { x: 0, y: 0, z: 0 }) => {
    if (!nodeName || !targetJointId) {
      alert('请输入物体节点名称并选择目标关节！');
      return;
    }

    // 检查节点是否存在
    let objectNode = null;
    scene.traverse((object) => {
      if (object.name === nodeName) {
        objectNode = object;
      }
    });

    if (!objectNode) {
      alert(`未找到名为 "${nodeName}" 的节点！请检查节点名称是否正确。`);
      return;
    }

    // 检查是否已经存在
    const exists = followerObjects.find(f => f.nodeName === nodeName);
    if (exists) {
      alert('该物体已经被添加为跟随物体！');
      return;
    }

    // 获取目标关节
    const targetJoint = joints.find(j => j.id === targetJointId);
    if (!targetJoint) {
      alert('未找到目标关节！');
      return;
    }

    // 保存物体的原始父级
    const originalParent = objectNode.parent;
    
    // 记录物体相对于目标关节的初始偏移量
    let jointNode = null;
    scene.traverse((object) => {
      if (object.name === targetJoint.nodeName) {
        jointNode = object;
      }
    });

    if (!jointNode) {
      alert(`未找到关节节点 "${targetJoint.nodeName}"！`);
      return;
    }

    // 计算初始偏移（世界坐标）
    const objectWorldPos = new THREE.Vector3();
    const jointWorldPos = new THREE.Vector3();
    objectNode.getWorldPosition(objectWorldPos);
    jointNode.getWorldPosition(jointWorldPos);
    
    const initialOffset = objectWorldPos.clone().sub(jointWorldPos);

    const newFollower = {
      id: Date.now(),
      nodeName: nodeName,
      targetJointId: targetJointId,
      targetJointName: targetJoint.name,
      initialOffset: { x: initialOffset.x, y: initialOffset.y, z: initialOffset.z }, // 初始偏移（当前位置）
      targetOffset: targetOffset, // 目标偏移（用户设置）
      currentOffset: { x: initialOffset.x, y: initialOffset.y, z: initialOffset.z }, // 当前偏移（动画中）
      transitionProgress: transitionDuration > 0 ? 0 : 1, // 过渡进度 0-1，0秒则直接完成
      transitionDuration: transitionDuration, // 过渡时长（秒），0=瞬间移动，>0=平滑过渡
      originalParent: originalParent,
      enabled: true
    };

    updateFollowerObjects([...followerObjects, newFollower]);
    
    // 应用跟随关系（建立父子层级）
    setTimeout(() => applyFollowerAttachment(), 0);

    if (transitionDuration > 0) {
      alert(`✅ 物体 "${nodeName}" 将在 ${transitionDuration} 秒内平滑移动到 "${targetJoint.name}"！`);
    } else {
      alert(`✅ 物体 "${nodeName}" 已瞬间移动到 "${targetJoint.name}"！`);
    }
  };

  // 🎯 移除跟随物体
  const removeFollowerObject = (followerId) => {
    const follower = followerObjects.find(f => f.id === followerId);
    if (!follower) return;

    // 恢复物体的原始父级
    let objectNode = null;
    scene.traverse((object) => {
      if (object.name === follower.nodeName) {
        objectNode = object;
      }
    });

    if (objectNode && follower.originalParent) {
      // 保存当前世界位置
      const worldPos = new THREE.Vector3();
      objectNode.getWorldPosition(worldPos);
      
      // 移除父级关系
      if (objectNode.parent) {
        objectNode.removeFromParent();
      }
      
      // 恢复原始父级
      follower.originalParent.add(objectNode);
      
      // 恢复世界位置
      const localPos = follower.originalParent.worldToLocal(worldPos.clone());
      objectNode.position.copy(localPos);
    }

    updateFollowerObjects(followerObjects.filter(f => f.id !== followerId));
  };

  // 🎯 更新跟随物体的过渡动画
  const updateFollowerTransitions = (deltaTime) => {
    const updatedFollowers = followerObjects.map(follower => {
      // 如果已经完成过渡，或者没有设置过渡时长，直接返回
      if (follower.transitionProgress >= 1 || follower.transitionDuration === 0) {
        return follower;
      }

      // 更新过渡进度
      const newProgress = Math.min(1, follower.transitionProgress + (deltaTime / follower.transitionDuration));
      
      // 计算当前偏移量（线性插值）
      const t = newProgress; // 可以使用缓动函数，这里使用线性
      const initialOffset = follower.initialOffset;
      const targetOffset = follower.targetOffset;
      
      const currentOffset = {
        x: initialOffset.x + (targetOffset.x - initialOffset.x) * t,
        y: initialOffset.y + (targetOffset.y - initialOffset.y) * t,
        z: initialOffset.z + (targetOffset.z - initialOffset.z) * t
      };

      return {
        ...follower,
        transitionProgress: newProgress,
        currentOffset: currentOffset
      };
    });

    // 如果有变化，更新状态
    if (JSON.stringify(updatedFollowers) !== JSON.stringify(followerObjects)) {
      updateFollowerObjects(updatedFollowers);
    }
  };

  // 🎯 应用跟随物体吸附
  const applyFollowerAttachment = (specificFollower = null) => {
    const followersToApply = specificFollower ? [specificFollower] : followerObjects;
    
    followersToApply.forEach(follower => {
      if (!follower.enabled) return;

      // 查找物体节点
      let objectNode = null;
      scene.traverse((object) => {
        if (object.name === follower.nodeName) {
          objectNode = object;
        }
      });

      if (!objectNode) {
        console.warn(`⚠️ 未找到物体节点: ${follower.nodeName}`);
        return;
      }

      // 查找目标关节节点 (支持字符串和数字ID)
      const targetJoint = joints.find(j => String(j.id) === String(follower.targetJointId));
      if (!targetJoint) {
        console.warn(`⚠️ 未找到目标关节ID: ${follower.targetJointId}`);
        return;
      }

      let jointNode = null;
      scene.traverse((object) => {
        if (object.name === targetJoint.nodeName) {
          jointNode = object;
        }
      });

      if (!jointNode) {
        console.warn(`⚠️ 未找到关节节点: ${targetJoint.nodeName}`);
        return;
      }

      // 将物体设置为关节的子级（如果还不是）
      if (objectNode.parent !== jointNode) {
        console.log(`✅ 吸附物体 "${follower.nodeName}" 到关节 "${targetJoint.name}"`);
        
        // 保存当前世界位置
        const worldPos = new THREE.Vector3();
        objectNode.getWorldPosition(worldPos);
        
        // 移除当前父级
        if (objectNode.parent) {
          objectNode.removeFromParent();
        }
        
        // 添加到关节节点
        jointNode.add(objectNode);
      }
      
      // 使用当前偏移量（支持过渡动画）
      const currentOffset = follower.currentOffset || follower.targetOffset || follower.offset || { x: 0, y: 0, z: 0 };
      objectNode.position.set(
        currentOffset.x,
        currentOffset.y,
        currentOffset.z
      );
    });
  };

  // 🎬 加载初始配置（用于程序化加载，而不是文件上传）
  useEffect(() => {
    if (initialConfig) {
      console.log("🎬 加载初始配置:", initialConfig);
      
      // 加载关节配置
      if (initialConfig.joints) {
        // 🔧 处理关节配置，补充缺失的 originalQuaternion
        const loadedJoints = initialConfig.joints.map(joint => {
          // 如果配置中没有 originalQuaternion，尝试从场景中获取
          if (!joint.originalQuaternion && joint.nodeName && scene) {
            let foundNode = null;
            scene.traverse((object) => {
              if (object.name === joint.nodeName) {
                foundNode = object;
              }
            });
            
            if (foundNode) {
              joint.originalQuaternion = {
                x: foundNode.quaternion.x,
                y: foundNode.quaternion.y,
                z: foundNode.quaternion.z,
                w: foundNode.quaternion.w
              };
              console.log(`🔧 自动获取节点 "${joint.nodeName}" 的初始旋转`);
            }
          }
          return joint;
        });
        
        updateJoints(loadedJoints);
      }
      
      // 🎯 加载跟随物体配置（如果有）
      if (initialConfig.followerObjects && initialConfig.followerObjects.length > 0) {
        // 恢复跟随物体（需要重新获取 originalParent）
        const loadedFollowers = initialConfig.followerObjects.map(f => {
          let originalParent = null;
          if (scene) {
            scene.traverse((object) => {
              if (object.name === f.nodeName) {
                originalParent = object.parent;
              }
            });
          }
          
          return {
            ...f,
            initialOffset: f.initialOffset || f.offset || { x: 0, y: 0, z: 0 },
            targetOffset: f.targetOffset || f.offset || { x: 0, y: 0, z: 0 },
            currentOffset: f.currentOffset || f.offset || { x: 0, y: 0, z: 0 },
            transitionProgress: f.transitionProgress !== undefined ? f.transitionProgress : 1,
            transitionDuration: f.transitionDuration || 0,
            originalParent: originalParent,
            enabled: f.enabled !== undefined ? f.enabled : true
          };
        });
        
        updateFollowerObjects(loadedFollowers);
        
        // 应用跟随关系（建立父子层级）
        setTimeout(() => applyFollowerAttachment(), 100);
      }
      
      // 检查是否有时间轴配置
      if (initialConfig.timeline && initialConfig.timeline.length > 0) {
        console.log("🎬 设置 timeline，长度:", initialConfig.timeline.length);
        setTimeline(initialConfig.timeline);
        setAnimationMode('timeline');
        
        // 恢复动作组（如果有）
        if (initialConfig.actionGroups && initialConfig.actionGroups.length > 0) {
          setActionGroups(initialConfig.actionGroups);
          const lastTime = initialConfig.actionGroups[initialConfig.actionGroups.length - 1].time;
          setCurrentActionTime(lastTime);
          
          console.log(`✅ 已加载 ${initialConfig.actionGroups.length} 个动作组，总时长: ${lastTime.toFixed(1)}秒`);
        } else {
          console.log('✅ 已加载 timeline 配置');
        }
      } else {
        setTimeline([]);
        setAnimationMode('manual');
        setActionGroups([]);
        setCurrentActionTime(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConfig]);

  // 保存当前状态为新动作组
  const saveCurrentAction = () => {
    if (!actionDescription.trim()) {
      alert('请输入动作描述！');
      return;
    }

    // 创建关键帧（记录当前所有关节的角度）
    const keyframe = {};
    joints.forEach(joint => {
      keyframe[joint.id] = { angle: joint.angle };
    });

    // 计算新动作的时间点
    const newActionTime = currentActionTime + actionDuration;

    // 创建新的动作组
    const newActionGroup = {
      id: Date.now(),
      time: newActionTime,
      duration: actionDuration,
      description: actionDescription,
      keyframe: keyframe,
      executionOrder: executionOrder, // 保存执行顺序
      // 🎯 保存物体吸附配置
      followerAttachment: enableFollowerInAction ? {
        nodeName: followerNodeName,
        targetJointId: followerTargetJointId,
        offset: { ...followerOffset },
        transitionDuration: followerTransitionDuration
      } : null
    };

    // 添加到动作组列表
    const updatedActionGroups = [...actionGroups, newActionGroup];
    setActionGroups(updatedActionGroups);

    // 更新累计时间
    setCurrentActionTime(newActionTime);

    // 构建完整的时间轴
    const newTimeline = buildTimelineFromActionGroups(updatedActionGroups);
    setTimeline(newTimeline);
    setAnimationMode('timeline');

    // 清空描述和物体吸附配置，准备下一个动作
    setActionDescription('');
    setEnableFollowerInAction(false);
    setFollowerNodeName('');
    setFollowerTargetJointId('');
    setFollowerOffset({ x: 0, y: 0, z: 0 });
    setFollowerTransitionDuration(0);

    const attachmentInfo = enableFollowerInAction 
      ? `\n🎯 物体吸附: ${followerNodeName} → ${joints.find(j => j.id === followerTargetJointId)?.name || '未知关节'}`
      : '';
    
    alert(`✅ 动作 "${newActionGroup.description}" 已保存！\n当前时间: ${newActionTime.toFixed(1)}秒${attachmentInfo}\n可以继续定义下一个动作。`);
  };

  // 从动作组构建完整时间轴
  const buildTimelineFromActionGroups = (groups) => {
    if (groups.length === 0) return [];

    const timelineItems = [];

    // 添加起始关键帧（时间0，所有角度为0）
    const initialKeyframe = {};
    joints.forEach(joint => {
      initialKeyframe[joint.id] = { angle: 0 };
    });
    timelineItems.push({
      time: 0,
      description: '🏁 初始状态',
      keyframe: initialKeyframe
    });

    // 添加所有动作组
    groups.forEach((group, groupIndex) => {
      const order = group.executionOrder || 'simultaneous';
      
      if (order === 'simultaneous') {
        // 同时执行：所有关节在同一时间点运动
        timelineItems.push({
          time: group.time,
          description: group.description,
          keyframe: group.keyframe,
          executionOrder: 'simultaneous'
        });
      } else {
        // 顺序执行：将关节运动分散到多个时间点
        const jointsToAnimate = joints.filter(joint => {
          const targetAngle = group.keyframe[joint.id]?.angle;
          // 获取上一个关键帧的角度
          const prevAngle = groupIndex > 0 
            ? (groups[groupIndex - 1].keyframe[joint.id]?.angle || 0)
            : 0;
          // 只动画有变化的关节
          return targetAngle !== undefined && targetAngle !== prevAngle;
        });

        if (jointsToAnimate.length === 0) {
          // 如果没有关节需要运动，添加一个空的时间点
          timelineItems.push({
            time: group.time,
            description: group.description,
            keyframe: group.keyframe,
            executionOrder: order
          });
          return;
        }

        // 确定关节顺序
        const orderedJoints = order === 'forward' 
          ? jointsToAnimate 
          : [...jointsToAnimate].reverse();

        // 计算每个关节的时间间隔
        const prevTime = groupIndex > 0 ? groups[groupIndex - 1].time : 0;
        const totalDuration = group.time - prevTime;
        const intervalDuration = totalDuration / orderedJoints.length;

        // 为每个关节创建单独的关键帧
        orderedJoints.forEach((joint, index) => {
          const stepTime = prevTime + (index + 1) * intervalDuration;
          
          // 复制上一个关键帧的所有角度
          const stepKeyframe = { ...group.keyframe };
          
          // 只更新当前关节的角度
          const currentKeyframe = {};
          currentKeyframe[joint.id] = { angle: group.keyframe[joint.id].angle };
          
          timelineItems.push({
            time: stepTime,
            description: `${group.description} - ${joint.name}`,
            keyframe: currentKeyframe,
            executionOrder: order,
            stepIndex: index,
            totalSteps: orderedJoints.length
          });
        });
      }
    });

    return timelineItems;
  };

  // 重置动作编辑器
  const resetActionEditor = () => {
    if (actionGroups.length > 0) {
      const confirm = window.confirm('确定要清空所有已保存的动作吗？这将无法恢复。');
      if (!confirm) return;
    }

    setActionGroups([]);
    setCurrentActionTime(0);
    setActionDescription('');
    setTimeline([]);
    setAnimationMode('manual');

    // 重置所有关节角度
    updateJoints(joints.map(joint => ({
      ...joint,
      angle: 0
    })));

    alert('✅ 动作编辑器已重置！');
  };

  // 删除指定的动作组
  const deleteActionGroup = (groupId) => {
    const updatedGroups = actionGroups.filter(g => g.id !== groupId);
    setActionGroups(updatedGroups);

    // 重新计算时间轴
    if (updatedGroups.length > 0) {
      // 重新计算所有时间点
      let cumulativeTime = 0;
      const recalculatedGroups = updatedGroups.map(group => {
        cumulativeTime += group.duration;
        return {
          ...group,
          time: cumulativeTime
        };
      });
      setActionGroups(recalculatedGroups);
      setCurrentActionTime(cumulativeTime);
      
      const newTimeline = buildTimelineFromActionGroups(recalculatedGroups);
      setTimeline(newTimeline);
    } else {
      setCurrentActionTime(0);
      setTimeline([]);
      setAnimationMode('manual');
    }
  };

  // 导出时间轴配置
  const exportTimelineConfiguration = () => {
    if (actionGroups.length === 0) {
      alert('没有可导出的动作！请先保存至少一个动作。');
      return;
    }

    const config = {
      version: '2.1', // 升级版本以支持跟随物体
      description: '渐进式动作编辑器生成的时间轴动画',
      joints: joints,
      timeline: timeline,
      actionGroups: actionGroups, // 保存原始动作组信息
      followerObjects: followerObjects.map(f => ({ // 保存跟随物体配置（不保存 originalParent）
        id: f.id,
        nodeName: f.nodeName,
        targetJointId: f.targetJointId,
        targetJointName: f.targetJointName,
        offset: f.offset,
        enabled: f.enabled
      })),
      settings: {
        interpolation: 'linear',
        loop: false,
        totalDuration: currentActionTime
      },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-arm-timeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`✅ 时间轴配置已导出！\n总时长: ${currentActionTime.toFixed(1)}秒\n动作数: ${actionGroups.length}个\n跟随物体: ${followerObjects.length}个`);
  };

  // 保存配置（原有功能，用于手动模式）
  const saveConfiguration = () => {
    const config = {
      version: '2.1',
      joints: joints,
      followerObjects: followerObjects.map(f => ({ // 保存跟随物体配置
        id: f.id,
        nodeName: f.nodeName,
        targetJointId: f.targetJointId,
        targetJointName: f.targetJointName,
        offset: f.offset,
        enabled: f.enabled
      })),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-arm-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 加载配置
  const loadConfiguration = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        
        // 🔧 处理加载的关节配置，补充缺失的 originalQuaternion
        const loadedJoints = (config.joints || []).map(joint => {
          // 如果配置中没有 originalQuaternion，尝试从场景中获取
          if (!joint.originalQuaternion && joint.nodeName && scene) {
            let foundNode = null;
            scene.traverse((object) => {
              if (object.name === joint.nodeName) {
                foundNode = object;
              }
            });
            
            if (foundNode) {
              joint.originalQuaternion = {
                x: foundNode.quaternion.x,
                y: foundNode.quaternion.y,
                z: foundNode.quaternion.z,
                w: foundNode.quaternion.w
              };
              console.log(`🔧 自动获取节点 "${joint.nodeName}" 的初始旋转`);
            }
          }
          return joint;
        });
        
        updateJoints(loadedJoints);
        
        // 🎯 加载跟随物体配置（如果有）
        if (config.followerObjects && config.followerObjects.length > 0) {
          // 恢复跟随物体（需要重新获取 originalParent）
          const loadedFollowers = config.followerObjects.map(f => {
            let originalParent = null;
            if (scene) {
              scene.traverse((object) => {
                if (object.name === f.nodeName) {
                  originalParent = object.parent;
                }
              });
            }
            
            return {
              ...f,
              originalParent: originalParent
            };
          });
          
          updateFollowerObjects(loadedFollowers);
          
          // 应用跟随关系（建立父子层级）
          setTimeout(() => applyFollowerAttachment(), 100);
        }
        
        // 检查是否有时间轴配置
        if (config.timeline && config.timeline.length > 0) {
          setTimeline(config.timeline);
          setAnimationMode('timeline');
          
          // 恢复动作组（如果有）
          if (config.actionGroups && config.actionGroups.length > 0) {
            setActionGroups(config.actionGroups);
            const lastTime = config.actionGroups[config.actionGroups.length - 1].time;
            setCurrentActionTime(lastTime);
            
            // 统计包含物体吸附的动作组数量
            const attachmentCount = config.actionGroups.filter(g => g.followerAttachment).length;
            
            let message = `✅ 时间轴配置加载成功！\n包含 ${config.actionGroups.length} 个动作组\n总时长: ${lastTime.toFixed(1)}秒`;
            if (attachmentCount > 0) {
              message += `\n🎯 物体吸附: ${attachmentCount}个动作组配置了吸附`;
            }
            alert(message);
          } else {
            alert('时间轴动画配置加载成功！点击播放按钮查看动画。');
          }
        } else {
          setTimeline([]);
          setAnimationMode('manual');
          setActionGroups([]);
          setCurrentActionTime(0);
          
          const followerCount = config.followerObjects?.length || 0;
          let message = '配置加载成功！';
          if (followerCount > 0) {
            message += `\n已加载 ${followerCount} 个跟随物体`;
          }
          alert(message);
        }
      } catch (error) {
        alert('配置文件格式错误！');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // 根据时间获取关节角度（线性插值）
  const getAngleAtTime = (jointId, time) => {
    if (timeline.length === 0) return 0;

    // 找到当前时间前后的关键帧
    let prevKeyframe = null;
    let nextKeyframe = null;

    for (let i = 0; i < timeline.length; i++) {
      const keyframe = timeline[i];
      if (keyframe.keyframe[jointId]) {
        if (keyframe.time <= time) {
          prevKeyframe = keyframe;
        }
        if (keyframe.time >= time && !nextKeyframe) {
          nextKeyframe = keyframe;
          break;
        }
      }
    }

    // 如果只有一个关键帧，使用该关键帧的值
    if (prevKeyframe && !nextKeyframe) {
      return prevKeyframe.keyframe[jointId]?.angle || 0;
    }
    if (!prevKeyframe && nextKeyframe) {
      return nextKeyframe.keyframe[jointId]?.angle || 0;
    }

    // 线性插值
    if (prevKeyframe && nextKeyframe) {
      const prevAngle = prevKeyframe.keyframe[jointId]?.angle || 0;
      const nextAngle = nextKeyframe.keyframe[jointId]?.angle || 0;
      const prevTime = prevKeyframe.time;
      const nextTime = nextKeyframe.time;

      const t = (time - prevTime) / (nextTime - prevTime);
      return prevAngle + (nextAngle - prevAngle) * t;
    }

    return 0;
  };

  // 应用时间轴上的角度到所有关节
  const applyTimelineAngles = (time) => {
    const updatedJoints = joints.map(joint => ({
      ...joint,
      angle: getAngleAtTime(joint.id, time)
    }));
    updateJoints(updatedJoints);
  };

  // 动画循环
  useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;

    let lastTime = Date.now();
    let animationFrameId;
    let isActive = true; // 添加活动标志防止清理后继续执行

    const animate = () => {
      if (!isActive) return; // 如果已清理，停止执行
      
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000 * playbackSpeed;
      lastTime = now;

      setCurrentTime(prevTime => {
        const maxTime = Math.max(...timeline.map(t => t.time));
        let newTime = prevTime + deltaTime;

        if (newTime >= maxTime) {
          if (loopAnimation) {
            newTime = 0;
          } else {
            newTime = maxTime;
            // 🚫 不要在这里设置 setIsPlaying(false)，让 useEffect 来处理
            // setIsPlaying(false);
          }
        }

        return newTime;
      });

      if (isActive) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      isActive = false; // 标记为非活动
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, timeline, playbackSpeed, loopAnimation]);

  // 根据当前时间更新关节角度
  useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;
    
    const updatedJoints = joints.map(joint => ({
      ...joint,
      angle: getAngleAtTime(joint.id, currentTime)
    }));
    updateJoints(updatedJoints);
    
    // 🎯 在每一帧都应用物体吸附（确保物体跟随关节移动）
    if (followerObjects.length > 0) {
      // 使用 setTimeout 确保在 DOM 更新后应用
      setTimeout(() => {
        applyFollowerAttachment();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  // 🎯 检测动作组切换并应用物体吸附
  useEffect(() => {
    if (!isPlaying || actionGroups.length === 0) return;

    // 找到当前时间对应的动作组
    let currentActionGroup = null;
    for (let i = actionGroups.length - 1; i >= 0; i--) {
      const group = actionGroups[i];
      // 动作组的开始时间 = 结束时间 - 持续时间
      const actionStartTime = group.time - group.duration;
      if (currentTime >= actionStartTime && currentTime <= group.time) {
        currentActionGroup = group;
        break;
      }
    }

    // 如果动作组有物体吸附配置，应用它
    if (currentActionGroup && currentActionGroup.followerAttachment) {
      const attachment = currentActionGroup.followerAttachment;
      
      console.log(`🎯 检测到物体吸附配置:`, attachment);
      
      // 检查是否已经存在这个吸附物体 (使用字符串比较)
      const existingFollower = followerObjects.find(
        f => f.nodeName === attachment.nodeName && String(f.targetJointId) === String(attachment.targetJointId)
      );

      // 如果不存在或配置有变化，则更新
      if (!existingFollower) {
        console.log(`✨ 创建新的物体吸附: ${attachment.nodeName} -> 关节ID ${attachment.targetJointId}`);
        
        // 移除同名节点的其他吸附（避免重复）
        const filteredFollowers = followerObjects.filter(f => f.nodeName !== attachment.nodeName);
        
        // 添加新的吸附
        const newFollower = {
          id: `follower_${Date.now()}`,
          nodeName: attachment.nodeName,
          targetJointId: String(attachment.targetJointId), // 转换为字符串确保一致性
          targetOffset: attachment.offset,
          transitionDuration: attachment.transitionDuration,
          enabled: true,
          transitionProgress: 0,
          currentOffset: attachment.offset || { x: 0, y: 0, z: 0 },
          transitionStartTime: Date.now()
        };

        const newFollowers = [...filteredFollowers, newFollower];
        updateFollowerObjects(newFollowers);

        // 🔥 立即应用吸附（使用新创建的 follower 对象）
        setTimeout(() => {
          applyFollowerAttachment(newFollower);
        }, 50); // 稍微延迟以确保状态更新
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isPlaying]);

  // 播放动画
  const playAnimation = () => {
    if (timeline.length === 0) {
      alert('请先加载包含时间轴的配置文件！');
      return;
    }
    setIsPlaying(true);
  };

  // 暂停动画
  const pauseAnimation = () => {
    setIsPlaying(false);
  };

  // 重置动画
  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (timeline.length > 0) {
      applyTimelineAngles(0);
    }
  };

  // 跳转到指定时间
  const seekToTime = (time) => {
    setCurrentTime(time);
    applyTimelineAngles(time);
  };

  // 🔇 如果不显示 UI，只返回 null（但组件仍会执行所有逻辑）
  if (!showUI) {
    return null;
  }

  return (
    <div className="robot-arm-animator">
      <div className="animator-header">
        <h2>🦾 机械臂动画配置器</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="animator-content">
        {/* 工具栏 */}
        <div className="animator-toolbar">
          <button onClick={addJoint} className="btn-primary">
            ➕ 添加关节
          </button>
          <button onClick={resetRotation} className="btn-secondary">
            ↺ 重置所有
          </button>
          <button onClick={saveConfiguration} className="btn-secondary">
            💾 保存配置
          </button>
          <label className="btn-secondary file-input-label">
            📂 加载配置
            <input 
              type="file" 
              accept=".json"
              onChange={loadConfiguration}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 渐进式动作编辑器 */}
        <div className="action-editor-panel">
          <div className="action-editor-header">
            <h3>🎬 渐进式动作编辑器</h3>
            <span className="action-time-display">
              当前时间: {currentActionTime.toFixed(1)}秒 | 已保存: {actionGroups.length}组
            </span>
          </div>

          <div className="action-editor-controls">
            <div className="action-input-group">
              <label>动作描述:</label>
              <input
                type="text"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="例如: 底座旋转30度"
                className="action-description-input"
              />
            </div>

            <div className="action-input-group">
              <label>持续时间:</label>
              <input
                type="number"
                value={actionDuration}
                onChange={(e) => setActionDuration(parseFloat(e.target.value) || 1)}
                min="0.1"
                step="0.5"
                className="action-duration-input"
              />
              <span>秒</span>
            </div>

            <div className="action-input-group">
              <label>执行顺序:</label>
              <select
                value={executionOrder}
                onChange={(e) => setExecutionOrder(e.target.value)}
                className="execution-order-select"
              >
                <option value="simultaneous">🔄 同时执行（所有关节同时运动）</option>
                <option value="forward">➡️ 正向顺序（关节1→2→3→4）</option>
                <option value="reverse">⬅️ 反向顺序（关节4→3→2→1）</option>
              </select>
            </div>
            </div>

          {/* 🎯 物体吸附配置面板（可折叠） */}
          <div className="follower-attachment-section">
            <div 
              className="follower-attachment-header"
              onClick={() => setEnableFollowerInAction(!enableFollowerInAction)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>
                {enableFollowerInAction ? '▼' : '▶'}
              </span>
              <input
                type="checkbox"
                checked={enableFollowerInAction}
                onChange={(e) => {
                  e.stopPropagation();
                  setEnableFollowerInAction(e.target.checked);
                }}
                style={{ marginRight: '8px' }}
              />
              <span>🎯 在此动作组中启用物体吸附</span>
            </div>

            {enableFollowerInAction && (
              <div className="follower-attachment-controls">
                <div className="action-input-group">
                  <label>物体节点名称:</label>
                  <input
                    type="text"
                    value={followerNodeName}
                    onChange={(e) => setFollowerNodeName(e.target.value)}
                    placeholder="例如: Lathe_Comp_1_006n"
                    className="action-description-input"
                  />
                  <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    💡 从场景中选择一个物体节点名称
                  </small>
                </div>

                <div className="action-input-group">
                  <label>目标关节:</label>
                  <select
                    value={followerTargetJointId}
                    onChange={(e) => setFollowerTargetJointId(e.target.value)}
                    className="execution-order-select"
                  >
                    <option value="">-- 选择关节 --</option>
                    {joints.map(joint => (
                      <option key={joint.id} value={joint.id}>
                        {joint.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="action-input-group">
                  <label>过渡时长（秒）:</label>
                  <input
                    type="number"
                    value={followerTransitionDuration}
                    onChange={(e) => setFollowerTransitionDuration(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="action-duration-input"
                  />
                  <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    💡 0=瞬间移动，&gt;0=平滑移动（推荐1-3秒）
                  </small>
                </div>

                <div className="follower-offset-controls">
                  <label style={{ marginBottom: '8px', display: 'block' }}>目标偏移量:</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px' }}>X:</label>
                      <input
                        type="number"
                        value={followerOffset.x}
                        onChange={(e) => setFollowerOffset({ ...followerOffset, x: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                        className="action-duration-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px' }}>Y:</label>
                      <input
                        type="number"
                        value={followerOffset.y}
                        onChange={(e) => setFollowerOffset({ ...followerOffset, y: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                        className="action-duration-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px' }}>Z:</label>
                      <input
                        type="number"
                        value={followerOffset.z}
                        onChange={(e) => setFollowerOffset({ ...followerOffset, z: parseFloat(e.target.value) || 0 })}
                        step="0.1"
                        className="action-duration-input"
                      />
                    </div>
                  </div>
                  <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    💡 默认(0,0,0)表示紧贴关节中心点
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className="action-editor-controls" style={{ marginTop: '16px' }}>
            <button onClick={saveCurrentAction} className="btn-save-action">
              💾 保存此动作
            </button>
            
            {actionGroups.length > 0 && (
              <>
                <button onClick={exportTimelineConfiguration} className="btn-export">
                  📤 导出时间轴
                </button>
                <button onClick={resetActionEditor} className="btn-reset-editor">
                  🗑️ 清空所有
                </button>
              </>
            )}
          </div>

          {/* 已保存的动作列表 */}
          {actionGroups.length > 0 && (
            <div className="saved-actions-list">
              <h4>已保存的动作序列:</h4>
              <div className="actions-timeline-view">
                {actionGroups.map((group, index) => (
                  <div key={group.id} className="action-group-item">
                    <div className="action-number">{index + 1}</div>
                    <div className="action-details">
                      <div className="action-desc">{group.description}</div>
                      <div className="action-time-info">
                        时间: {group.time.toFixed(1)}s (持续 {group.duration}s)
                      </div>
                      <div className="action-joints-info">
                        {Object.keys(group.keyframe).length} 个关节 | 
                        {group.executionOrder === 'simultaneous' && '🔄 同时执行'}
                        {group.executionOrder === 'forward' && '➡️ 正向顺序'}
                        {group.executionOrder === 'reverse' && '⬅️ 反向顺序'}
                        {group.followerAttachment && (
                          <span style={{ marginLeft: '8px', color: '#FFD700' }}>
                            | 🎯 吸附物体: {group.followerAttachment.nodeName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteActionGroup(group.id)}
                      className="btn-delete-action"
                      title="删除此动作"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <div className="action-summary">
                <strong>总时长:</strong> {currentActionTime.toFixed(1)}秒 | 
                <strong> 总动作数:</strong> {actionGroups.length}个
              </div>
            </div>
          )}

          <div className="action-editor-tips">
            <p><strong>💡 使用提示:</strong></p>
            <ol>
              <li>调整下方关节角度到目标位置</li>
              <li>输入动作描述和持续时间</li>
              <li>点击"保存此动作"</li>
              <li>机械臂保持在当前位置，继续定义下一个动作</li>
              <li>完成后点击"导出时间轴"保存完整动画</li>
            </ol>
          </div>
        </div>

        {/* 时间轴动画控制器 */}
        {animationMode === 'timeline' && timeline.length > 0 && (
          <div className="timeline-controller">
            <div className="timeline-header">
              <h3>⏱️ 时间轴动画</h3>
              <span className="timeline-info">
                共 {timeline.length} 个关键帧
              </span>
            </div>

            {/* 播放控制 */}
            <div className="playback-controls">
              {!isPlaying ? (
                <button onClick={playAnimation} className="btn-play">
                  ▶️ 播放
                </button>
              ) : (
                <button onClick={pauseAnimation} className="btn-pause">
                  ⏸️ 暂停
                </button>
              )}
              <button onClick={resetAnimation} className="btn-reset">
                ⏹️ 重置
              </button>
              
              <label className="loop-control">
                <input
                  type="checkbox"
                  checked={loopAnimation}
                  onChange={(e) => setLoopAnimation(e.target.checked)}
                />
                循环播放
              </label>

              <div className="speed-control">
                <label>速度:</label>
                <select 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>

            {/* 时间轴进度条 */}
            <div className="timeline-progress">
              <span className="time-display">
                {currentTime.toFixed(1)}s / {timeline[timeline.length - 1]?.time || 0}s
              </span>
              <input
                type="range"
                min="0"
                max={timeline[timeline.length - 1]?.time || 0}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekToTime(parseFloat(e.target.value))}
                className="timeline-slider"
              />
            </div>

            {/* 关键帧列表 */}
            <div className="keyframes-list">
              <h4>关键帧:</h4>
              {timeline.map((keyframe, index) => (
                <div 
                  key={index} 
                  className={`keyframe-item ${Math.abs(currentTime - keyframe.time) < 0.5 ? 'active' : ''}`}
                  onClick={() => seekToTime(keyframe.time)}
                >
                  <span className="keyframe-time">{keyframe.time}s</span>
                  <span className="keyframe-desc">{keyframe.description || `关键帧 ${index + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 关节列表 */}
        <div className="joints-list">
          {joints.length === 0 ? (
            <div className="empty-state">
              <p>还没有关节配置</p>
              <p>点击"添加关节"开始配置机械臂动画</p>
            </div>
          ) : (
            joints.map((joint, index) => (
              <div key={joint.id} className="joint-item">
                <div className="joint-header">
                  <span className="joint-number">关节 {index + 1}</span>
                  <input
                    type="text"
                    value={joint.name}
                    onChange={(e) => {
                      updateJoints(joints.map(j => 
                        j.id === joint.id ? { ...j, name: e.target.value } : j
                      ));
                    }}
                    className="joint-name-input"
                  />
                  <label className="joint-enable">
                    <input
                      type="checkbox"
                      checked={joint.enabled}
                      onChange={(e) => {
                        updateJoints(joints.map(j => 
                          j.id === joint.id ? { ...j, enabled: e.target.checked } : j
                        ));
                      }}
                    />
                    启用
                  </label>
                  <button 
                    onClick={() => removeJoint(joint.id)}
                    className="btn-remove"
                  >
                    🗑️
                  </button>
                </div>

                {/* 节点绑定 */}
                <div className="joint-node-input">
                  <label>绑定节点名称:</label>
                  <input
                    type="text"
                    value={joint.nodeName}
                    onChange={(e) => updateJointNodeName(joint.id, e.target.value)}
                    placeholder="输入节点名称..."
                  />
                </div>

                {/* 关节位置（自动从节点获取） */}
                <div className="joint-position">
                  <label>关节位置:</label>
                  <div className="position-display">
                    <span>X: {joint.position.x.toFixed(2)}</span>
                    <span>Y: {joint.position.y.toFixed(2)}</span>
                    <span>Z: {joint.position.z.toFixed(2)}</span>
                  </div>
                </div>

                {/* 旋转轴设置 */}
                <div className="joint-rotation-axis">
                  <label>旋转轴:</label>
                  <div className="axis-inputs">
                    <div className="axis-input">
                      <label>X:</label>
                      <input
                        type="number"
                        value={joint.rotationAxis.x}
                        onChange={(e) => updateRotationAxis(joint.id, 'x', e.target.value)}
                        step="0.1"
                        min="-1"
                        max="1"
                      />
                    </div>
                    <div className="axis-input">
                      <label>Y:</label>
                      <input
                        type="number"
                        value={joint.rotationAxis.y}
                        onChange={(e) => updateRotationAxis(joint.id, 'y', e.target.value)}
                        step="0.1"
                        min="-1"
                        max="1"
                      />
                    </div>
                    <div className="axis-input">
                      <label>Z:</label>
                      <input
                        type="number"
                        value={joint.rotationAxis.z}
                        onChange={(e) => updateRotationAxis(joint.id, 'z', e.target.value)}
                        step="0.1"
                        min="-1"
                        max="1"
                      />
                    </div>
                  </div>
                  <p className="axis-hint">旋转轴向量会自动归一化。常用: Y轴(0,1,0) Z轴(0,0,1)</p>
                </div>

                {/* 父关节显示 */}
                {joint.parentJointId && (
                  <div className="joint-parent">
                    <label>父关节:</label>
                    <span>
                      {joints.find(j => j.id === joint.parentJointId)?.name || '无'}
                    </span>
                  </div>
                )}

                {/* 当前旋转角度 */}
                <div className="joint-rotation">
                  <h4>旋转角度（度）</h4>
                  <div className="rotation-control-single">
                    <input
                      type="number"
                      value={joint.angle}
                      onChange={(e) => updateJointAngle(joint.id, e.target.value)}
                      step="1"
                      className="angle-input"
                    />
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={joint.angle}
                      onChange={(e) => updateJointAngle(joint.id, e.target.value)}
                      className="angle-slider"
                    />
                    <span className="angle-display">{joint.angle}°</span>
                  </div>
                  <p className="rotation-hint">绕旋转轴旋转的角度</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="animator-help">
        <h4>💡 使用提示:</h4>
        <ul>
          <li>1. 添加关节并输入要控制的节点名称</li>
          <li>2. 设置旋转轴方向（默认Y轴向上）</li>
          <li>3. 调整旋转角度，实时预览效果</li>
          <li>4. 每个关节只绕单个旋转轴旋转</li>
          <li>5. 保存配置以便后续使用</li>
        </ul>
      </div>
    </div>
  );
};

// 🎯 独立的跟随物体管理面板已弃用
// 现在通过"渐进式动作编辑器"中的"物体吸附"功能来配置物体跟随

// 3D场景中的关节可视化组件（在Canvas内使用）
export function JointVisualization({ joints, followerObjects = [] }) {
  return (
    <group>
      {/* 关节位置标记 */}
      {joints.map((joint, index) => {
        // 只显示有效位置的关节
        if (!joint.position || (joint.position.x === 0 && joint.position.y === 0 && joint.position.z === 0)) {
          return null;
        }
        
        const isBase = joint.type === 'base';
        const color = isBase ? '#ff4444' : '#44ff44';
        
        return (
          <group key={joint.id} position={[joint.position.x, joint.position.y, joint.position.z]}>
            {/* 球体标记 */}
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
            
            {/* 标签 */}
            <Html distanceFactor={10}>
              <div
                style={{
                  background: color,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {joint.name}
              </div>
            </Html>
            
            {/* 连接线到父关节 */}
            {joint.parentJointId && (() => {
              const parentJoint = joints.find(j => j.id === joint.parentJointId);
              if (!parentJoint || !parentJoint.position) return null;
              
              const points = [
                new THREE.Vector3(parentJoint.position.x, parentJoint.position.y, parentJoint.position.z),
                new THREE.Vector3(joint.position.x, joint.position.y, joint.position.z)
              ];
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              
              return (
                <line key={`line-${joint.id}`} geometry={geometry}>
                  <lineBasicMaterial color="#ffffff" opacity={0.6} transparent />
                </line>
              );
            })()}
          </group>
        );
      })}
      
      {/* 🎯 跟随物体的可视化连接线 */}
      {followerObjects.filter(f => f.enabled).map((follower) => {
        const targetJoint = joints.find(j => j.id === follower.targetJointId);
        if (!targetJoint || !targetJoint.position) return null;
        
        // 计算跟随物体的实际位置（关节位置 + 偏移）
        const followerPos = new THREE.Vector3(
          targetJoint.position.x + follower.offset.x,
          targetJoint.position.y + follower.offset.y,
          targetJoint.position.z + follower.offset.z
        );
        
        return (
          <group key={`follower-viz-${follower.id}`}>
            {/* 跟随物体位置标记 */}
            <mesh position={[followerPos.x, followerPos.y, followerPos.z]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshBasicMaterial color="#AB47BC" transparent opacity={0.7} />
            </mesh>
            
            {/* 连接线到关节 */}
            <line key={`follower-line-${follower.id}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    targetJoint.position.x, targetJoint.position.y, targetJoint.position.z,
                    followerPos.x, followerPos.y, followerPos.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#AB47BC" opacity={0.5} transparent linewidth={2} />
            </line>
            
            {/* 跟随物体标签 */}
            <Html position={[followerPos.x, followerPos.y + 0.2, followerPos.z]} distanceFactor={10}>
              <div
                style={{
                  background: '#AB47BC',
                  color: 'white',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                🎯 {follower.nodeName}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default RobotArmAnimator;

