// CAM 可以同时上传多个文件，但创建项目文件的接口  /api/client/project/files一次只能提交一个

import {
  createProjectAttachment,
  updateProjectAttachment
} from '@/api/client/attachment'
import {
  createProject,
  updateProject,
  createProjectFile,
  updateProjectFile,
  createProjectOriginalFile,
  updateProjectOriginalFile
} from '@/api/client/project'

import { ProjectFileParams, ProjectOriginalFileParams } from '@/types/project'
import { parseFileInfo } from '@/lib/file'

const servicesMap = {
  project: {
    create: createProject,
    update: updateProject
  },
  files: {
    create: createProjectFile,
    update: updateProjectFile
  },
  original_files: {
    create: createProjectOriginalFile,
    update: updateProjectOriginalFile
  },
  attachments: {
    create: createProjectAttachment,
    update: updateProjectAttachment
  }
}

type TreeNode = {
  id: string
  name: string
}

// 参数格式转换
export function transformParamsData(
  firstLevelKey: string,
  secondLevelKeys: string[] | number[],
  allValues: any
): () => Promise<any> {
  const firstLevelData = allValues?.[firstLevelKey] || []

  return () => {
    return Promise.all(
      secondLevelKeys.map(key => {
        const secondLevelData = firstLevelData?.[key] || {}
        const project_id = allValues?.projectId

        const { response, thumbnail, cutters, blank, id } = secondLevelData
        const type = id ? 'update' : 'create'

        // console.log(
        //   '===== transformParamsData =====',
        //   type,
        //   key,
        //   secondLevelData
        // )

        switch (firstLevelKey) {
          case 'files':
            if (!response) {
              return Promise.reject('file is uploading, skip!')
            }

            const fileInfo = response?.key
              ? parseFileInfo(response?.key)
              : { name: '', extension: '' }

            // update的时候可以修改file name
            const newName =
              type === 'create' ? fileInfo.name : response.fileName

            const filesData: ProjectFileParams = {
              name: newName,
              file_name: newName,
              file_path: response.key,
              file_size: response.size,
              file_type: fileInfo.extension,
              last_modified: response.lastModified,
              thumbnail,
              cutters,
              blank
            }

            if (type === 'update') {
              if (!id) {
                return Promise.reject(new Error('Missing id for update'))
              }
              return servicesMap[firstLevelKey][type]({
                ...filesData,
                id
              })
            } else {
              return servicesMap[firstLevelKey][type]({
                ...filesData,
                project_id
              })
            }

          // 项目原始文件
          case 'original_files':
          case 'attachments':
            if (!response) {
              return Promise.reject('file is uploading, skip!')
            }
            const originalFileInfo = response?.key
              ? parseFileInfo(response?.key)
              : { name: '', extension: '' }
            const originalFilesData: ProjectOriginalFileParams = {
              name: originalFileInfo.name,
              file_name: originalFileInfo.name,
              file_path: response.key,
              file_size: response.size,
              file_type: originalFileInfo.extension,
              last_modified: response.lastModified,
              thumbnail
            }

            if (type === 'update') {
              if (!id) {
                return Promise.reject(new Error('Missing id for update'))
              }
              return servicesMap[firstLevelKey][type]({
                ...originalFilesData,
                id
              })
            } else {
              return servicesMap[firstLevelKey][type]({
                ...originalFilesData,
                project_id
              })
            }

          // 基本信息，只更新指定字段
          case 'project':
            const projectFiledData = firstLevelData?.[key]
            let formatData = projectFiledData

            // Cascader 默认返回数组， category_id  只取最后一个值

            if (key === 'machines_used') {
              if (formatData.id !== 'machine-uuid') {
                formatData = {
                  id: '',
                  name: formatData.name
                }
              } else {
                formatData = {
                  id: formatData.id,
                  name: ''
                }
              }
            } else if (key === 'category_id') {
              formatData = formatData[formatData.length - 1]
            }

            console.log('formatData: ', firstLevelKey, key, formatData)

            if (project_id) {
              return servicesMap[firstLevelKey]['update']({
                [key]: formatData,
                id: project_id
              })
            } else {
              console.log('Create a new project')
              return servicesMap[firstLevelKey]['create']({
                [key]: formatData
              })
            }

          default:
            return Promise.resolve()
        }
      })
    )
  }
}

// 格式化返回数据，更新到form，要求接口返回的数据必须包含参数中传递的字段

export function transformResponseData(
  data: any,
  firstLevelKey: string,
  secondLevelKey: string | number,
  allValues: any
) {
  let res: any = {}

  // 数据格式转换
  if (
    firstLevelKey === 'files' ||
    firstLevelKey === 'original_files' ||
    firstLevelKey === 'attachments'
  ) {
    res = {
      ...data
    }

    // 需要把file.response 带回来
    res.response = allValues[firstLevelKey]?.[secondLevelKey]?.response
  } else if (firstLevelKey === 'project') {
    if (typeof secondLevelKey !== 'undefined') {
      res[secondLevelKey] = data[secondLevelKey]
    }

    if (data.machines_used) {
      res.machines_used = {
        id: data.machines_used.id || 'other',
        name: data.machines_used.name || ''
      }
    }

    if (data.category_id) {
      res.category_id = allValues.project.category_id
    }
  }

  return res
}
