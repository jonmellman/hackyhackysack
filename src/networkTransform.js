
//class for helping with throttling and synchronizing of transform information
//based on a unity approach.

class NetworkTransform {
    constructor() {
        
    }

    //generic serialize for transform info (rotation + translation)
    //a transform object has a position and quaternion
    static serialize(transformObject){
        return {
            quaternion: transformObject.quaternion.toArray(),
            position: {
                x: transformObject.position.x,
                y: transformObject.position.y,
                z: transformObject.position.z
            },
        }
    }

    //generic deserialize for transform info (rotation + translation)
    //a transform object has a position and quaternion
    static deserialize(transformObject) {
        return {
            quaternion: (new THREE.Quaternion()).fromArray(transformObject.quaternion),
            position: new THREE.Vector3(
                transformObject.position.x,
                transformObject.position.y,
                transformObject.position.z
            )
        }
    }

}