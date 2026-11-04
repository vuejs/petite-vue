const fs = require('fs')
const path = require('path')
const chalk = require('chalk').default
const semver = require('semver')
const { prompt } = require('enquirer')
const { execa } = require('execa')
const prettier = require('prettier')
const pkgPath = path.resolve(__dirname, '../package.json')
const currentVersion = require(pkgPath).version
const rootDir = path.resolve(__dirname, '../../..')

const versionIncrements = ['patch', 'minor', 'major']

const inc = (i) => semver.inc(currentVersion, i)
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
const step = (msg) => console.log(chalk.cyan(msg))

async function selectTargetVersion() {
  const { release } = await prompt({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements.map((i) => `${i} (${inc(i)})`).concat(['custom'])
  })

  let targetVersion
  if (release === 'custom') {
    targetVersion = (
      await prompt({
        type: 'input',
        name: 'version',
        message: 'Input custom version',
        initial: currentVersion
      })
    ).version
  } else {
    targetVersion = release.match(/\((.*)\)/)[1]
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid target version: ${targetVersion}`)
  }
  return targetVersion
}

async function confirmAction(message) {
  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message
  })
  return yes
}

function updatePackage(version) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

async function formatChangelog() {
  const changelogPath = path.resolve(rootDir, 'CHANGELOG.md')
  const content = fs.readFileSync(changelogPath, 'utf-8')
  const formatted = await prettier.format(content, { parser: 'markdown' })
  fs.writeFileSync(changelogPath, formatted)
}

async function buildAndChangelog(targetVersion) {
  step('\nUpdating the package version...')
  updatePackage(targetVersion)

  step('\nBuilding the package...')
  await run('pnpm', ['pocket-vue', 'build'], { cwd: rootDir })

  step('\nGenerating the changelog...')
  await run('pnpm', ['exec', 'conventional-changelog', '-p', 'angular', '-i', 'CHANGELOG.md', '-s'], { cwd: rootDir })
  await formatChangelog()
}

async function commitAndTag(targetVersion) {
  step('\nCommitting changes...')
  await run('git', ['add', path.resolve(rootDir, 'CHANGELOG.md'), pkgPath], { cwd: rootDir })
  await run('git', ['commit', '-m', `release: v${targetVersion}`], { cwd: rootDir })
  await run('git', ['tag', `v${targetVersion}`], { cwd: rootDir })
}

async function publishAndPush(targetVersion) {
  step('\nPublishing to npm...')
  await run('pnpm', ['--filter', 'pocket-vue', 'publish', '--access', 'public'], { cwd: rootDir })

  step('\nPushing to GitHub...')
  await run('git', ['push', 'origin', `refs/tags/v${targetVersion}`], { cwd: rootDir })
  await run('git', ['push'], { cwd: rootDir })
}

async function main() {
  const targetVersion = await selectTargetVersion()

  if (!(await confirmAction(`Releasing v${targetVersion}. Confirm?`))) {
    return
  }

  await buildAndChangelog(targetVersion)

  if (!(await confirmAction('Changelog generated. Does it look good?'))) {
    return
  }

  await commitAndTag(targetVersion)
  await publishAndPush(targetVersion)
}

main().catch((err) => console.error(err))
