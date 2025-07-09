import { PrismaClient } from '@/generated/prisma'

export async function seedLicenses(prisma: PrismaClient) {
  console.log('开始初始化许可证数据...')

  const licenses = await Promise.all([
    prisma.licenses.upsert({
      where: { code: 'cc_by' },
      update: {
        name: 'CC BY 4.0',
        thumbnail: '/cc/cc_by.png',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY 4.0',
        code: 'cc_by',
        thumbnail: '/cc/cc_by.png',
        link: 'https://creativecommons.org/licenses/by/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.'
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_by_sa' },
      update: {
        name: 'CC BY-SA 4.0',
        thumbnail: '/cc/cc_by_sa.png',
        link: 'https://creativecommons.org/licenses/by-sa/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms. ',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY-SA 4.0',
        code: 'cc_by_sa',
        thumbnail: '/cc/cc_by_sa.png',
        link: 'https://creativecommons.org/licenses/by-sa/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms. '
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_by_nd' },
      update: {
        name: 'CC BY-ND 4.0',
        thumbnail: '/cc/cc_by_nd.png',
        link: 'https://creativecommons.org/licenses/by-nd/4.0/',
        description:
          'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use. ',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY-ND 4.0',
        code: 'cc_by_nd',
        thumbnail: '/cc/cc_by_nd.png',
        link: 'https://creativecommons.org/licenses/by-nd/4.0/',
        description:
          'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use. '
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_by_nc' },
      update: {
        name: 'CC BY-NC 4.0',
        thumbnail: '/cc/cc_by_nc.png',
        link: 'https://creativecommons.org/licenses/by-nc/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY-NC 4.0',
        code: 'cc_by_nc',
        thumbnail: '/cc/cc_by_nc.png',
        link: 'https://creativecommons.org/licenses/by-nc/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.'
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_by_nc_sa' },
      update: {
        name: 'CC BY-NC-SA 4.0',
        thumbnail: '/cc/cc_by_nc_sa.png',
        link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY-NC-SA 4.0',
        code: 'cc_by_nc_sa',
        thumbnail: '/cc/cc_by_nc_sa.png',
        link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        description:
          'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.'
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_by_nc_nd' },
      update: {
        name: 'CC BY-NC-ND 4.0',
        thumbnail: '/cc/cc_by_nc_nd.png',
        link: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
        description:
          'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator. ',
        updated_at: new Date()
      },
      create: {
        name: 'CC BY-NC-ND 4.0',
        code: 'cc_by_nc_nd',
        thumbnail: '/cc/cc_by_nc_nd.png',
        link: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
        description:
          'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator. '
      }
    }),
    prisma.licenses.upsert({
      where: { code: 'cc_0' },
      update: {
        name: 'CC0 1.0',
        thumbnail: '/cc/cc_0.png',
        link: 'https://creativecommons.org/publicdomain/zero/1.0/',
        description:
          'CC0 (aka CC Zero) is a public dedication tool, which enables creators to give up their copyright and put their works into the worldwide public domain. CC0 enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions.',
        updated_at: new Date()
      },
      create: {
        name: 'CC0 1.0',
        code: 'cc_0',
        thumbnail: '/cc/cc0.png',
        link: 'https://creativecommons.org/publicdomain/zero/1.0/',
        description:
          'CC0 (aka CC Zero) is a public dedication tool, which enables creators to give up their copyright and put their works into the worldwide public domain. CC0 enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions.'
      }
    })
  ])

  console.log(`🎉 创建/更新了 ${licenses.length} 个许可证`)
  return licenses
}
