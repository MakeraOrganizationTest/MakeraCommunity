/*
 * @LastEditTime: 2025-07-09 18:24:01
 * @Description: ...
 * @Date: 2025-06-05 10:55:41
 * @Author: isboyjc
 * @LastEditors: isboyjc
 */
'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

type Props = {
  spec: Record<string, any>
}

function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />
}

export default ReactSwagger
