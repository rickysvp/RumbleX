#!/usr/bin/env node

/**
 * RumbleX Version Management Script
 * 
 * Usage:
 *   node scripts/version.js patch  - Increment patch version (0.1.0 -> 0.1.1)
 *   node scripts/version.js minor  - Increment minor version (0.1.0 -> 0.2.0)
 *   node scripts/version.js major  - Increment major version (0.1.0 -> 1.0.0)
 *   node scripts/version.js get    - Get current version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const versionFilePath = path.join(rootDir, 'version.json');
const packageJsonPath = path.join(rootDir, 'package.json');

function readVersionFile() {
  const content = fs.readFileSync(versionFilePath, 'utf-8');
  return JSON.parse(content);
}

function writeVersionFile(data) {
  fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function readPackageJson() {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(content);
}

function writePackageJson(data) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function incrementVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
      version.patch++;
      break;
    default:
      throw new Error(`Unknown version increment type: ${type}`);
  }
  
  return formatVersion(version);
}

function updateVersion(type, changeDescription = '') {
  const versionData = readVersionFile();
  const packageData = readPackageJson();
  
  const oldVersion = versionData.version;
  const newVersion = incrementVersion(oldVersion, type);
  const releaseDate = new Date().toISOString().split('T')[0];
  
  // Update version.json
  versionData.version = newVersion;
  versionData.releaseDate = releaseDate;
  
  // Add changelog entry
  if (!versionData.changelog) {
    versionData.changelog = {};
  }
  
  versionData.changelog[newVersion] = {
    date: releaseDate,
    changes: changeDescription ? [changeDescription] : [`${type} version bump`]
  };
  
  writeVersionFile(versionData);
  
  // Update package.json
  packageData.version = newVersion;
  writePackageJson(packageData);
  
  console.log(`✅ Version updated: ${oldVersion} -> ${newVersion}`);
  console.log(`   Release date: ${releaseDate}`);
  
  return { oldVersion, newVersion, releaseDate };
}

function createGitTag(version) {
  try {
    const tagName = `v${version}`;
    execSync(`git add version.json package.json`, { cwd: rootDir, stdio: 'inherit' });
    execSync(`git commit -m "chore(release): bump version to ${version}"`, { cwd: rootDir, stdio: 'inherit' });
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✅ Git tag created: ${tagName}`);
    return tagName;
  } catch (error) {
    console.error('❌ Failed to create git tag:', error.message);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const versionData = readVersionFile();
  console.log(`Current version: ${versionData.version}`);
  console.log(`Release date: ${versionData.releaseDate}`);
  console.log(`Channel: ${versionData.channel}`);
  return versionData.version;
}

function showHelp() {
  console.log(`
RumbleX Version Management

Usage:
  node scripts/version.js <command> [options]

Commands:
  patch [message]   Increment patch version (0.1.0 -> 0.1.1)
  minor [message]   Increment minor version (0.1.0 -> 0.2.0)
  major [message]   Increment major version (0.1.0 -> 1.0.0)
  get               Get current version
  help              Show this help message

Options:
  --tag, -t         Create git tag after version bump
  --push, -p        Push changes and tags to remote

Examples:
  node scripts/version.js patch "Fix critical bug"
  node scripts/version.js minor --tag "Add new feature"
  node scripts/version.js major -t -p "Breaking changes"
`);
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

if (command === 'get') {
  getCurrentVersion();
  process.exit(0);
}

const validCommands = ['patch', 'minor', 'major'];
if (!validCommands.includes(command)) {
  console.error(`❌ Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

// Parse options
const shouldTag = args.includes('--tag') || args.includes('-t');
const shouldPush = args.includes('--push') || args.includes('-p');

// Get change description (first non-option argument after command)
const changeDescription = args.slice(1).find(arg => !arg.startsWith('-')) || '';

// Update version
const { newVersion } = updateVersion(command, changeDescription);

// Create git tag if requested
if (shouldTag) {
  createGitTag(newVersion);
  
  if (shouldPush) {
    try {
      execSync('git push origin HEAD', { cwd: rootDir, stdio: 'inherit' });
      execSync('git push origin --tags', { cwd: rootDir, stdio: 'inherit' });
      console.log('✅ Changes and tags pushed to remote');
    } catch (error) {
      console.error('❌ Failed to push to remote:', error.message);
      process.exit(1);
    }
  }
}

console.log(`\n🎉 Version ${newVersion} is ready!`);
