#!/usr/bin/env python3
"""
Script to regenerate the codebase dump files.
This script generates:
1. matchalize_full_dump.md - Complete dump of all files
2. server_dump.md - Server-only dump

The dumps capture the verbatim contents of source files, config files,
and scripts, reflecting the current state after all recent changes.
"""

import os
import json
import sys
from pathlib import Path

# Configuration
BASE_DIR = Path('/Users/adibhati/Documents/vybe')
PROJECT_ROOTS = [
    BASE_DIR / 'client',
    BASE_DIR / 'server',
]

# Files/dirs to exclude from dumps (keep in .gitignore)
EXCLUDE_DIRS = {
    'client/node_modules',
    'client/.git', 
    'client/.vite',
    'server/node_modules',
    'server/.git',
    'server/.nyc_output',
}

EXCLUDE_FILES = {
    '.env',
    '.env.*',
    'package-lock.json',
    'node_modules',
}

IGNORE_FILES = {'README.md', 'README.rst', 'README.txt', 'CONTRIBUTING.md'}

# Type filters for file extensions to include
INCLUDE_FILE_TYPES = {
    # Source files
    '.js', '.jsx', '.ts', '.tsx',
    '.json', 
    '.md', '.txt', '.rst',
    # Config and package files
    '.config',
    '.jsonc', 
    '.babelrc', 
    '.eslintrc', 
    '.stylelintrc',
    # Scripts and tooling
    '.sh', '.bash', '.yml', '.yaml', '.toml',
    # Infrastructure and deployment
    '.dockerfile',
    'Dockerfile', 
    '.dockerignore',
    # Environment and config
    '.env*', 
    '.env.example',
    # Documentation
}

# Files to organize by parent directory
DIR_ORGANIZATION = {
    'client/.env': 'Configuration',
    'client/.oxlintrc.json': 'Linting',
    'client/vite.config.js': 'Build Tools',
    'server/config/': 'Server Configuration',
    'server/routes/': 'API Routes',
    'scripts/': 'Build/Automation Scripts',
}

# Files to extract just headers and callouts
NEATENED_FILES = {
    'server/index.js': 'Server Entry Point',
}

def should_include_file(file_path: str) -> bool:
    """Determine if a file should be included in the dump."""
    path_obj = Path(file_path)
    
    # Get file name and extension
    file_name = path_obj.name
    file_ext = path_obj.suffix.lower()
    parent_dir = str(path_obj.parent)
    
    # Check if parent is in exclude list
    for excluded_dir in EXCLUDE_DIRS:
        if excluded_dir in parent_dir.replace('/Users/adibhati/Documents/vybe', ''):
            return False
    
    # Check if it's a directory (should not happen in file walk)
    if path_obj.is_dir():
        return False
    
    # Check if file is in exclude list
    base_name = os.path.basename(file_path)
    if base_name in EXCLUDE_FILES:
        return False
    
    # Handle pattern matching for exclude files
    for pattern in EXCLUDE_FILES:
        if '*' in pattern:
            import fnmatch
            if fnmatch.fnmatch(base_name, pattern):
                return False
        elif pattern in base_name:
            return False
    
    # Special handling for specific files
    if file_name in IGNORE_FILES:
        return False
    
    # Include most file types by default
    if len(file_ext) > 0:
        return True
    
    # Always include these root package files
    if file_name in ['package.json', 'package-lock.json', '.env.example']:
        return True
    
    return True

def get_file_section_title(file_path: str, content_lines: list[str]) -> str:
    """Generate a descriptive section title for a file."""
    path_obj = Path(file_path)
    
    # Check for organized entries first
    rel_path = path_obj.relative_to(BASE_DIR)
    rel_path_str = str(rel_path)
    
    # Handle nested directories
    for dir_pattern, title in DIR_ORGANIZATION.items():
        if dir_pattern.endswith('/'):
            if rel_path_str.startswith(dir_pattern):
                if dir_pattern == 'server/routes/':
                    route_name = os.path.basename(rel_path)[:-3]  # Strip .js
                    return f"{title}{route_name.title().replace('-', ' ')}"
                else:
                    return title
        elif dir_pattern in rel_path_str:
            return title
    
    # Special handling for API routes
    if rel_path.parent.name == 'routes' and rel_path.parent.parent == Path('server'):
        route_name = rel_path.stem.replace('.js', '')
        return f"Server API Routes: {route_name.replace('-', ' ').title()}"
    
    # For specific files with special content
    if 'server/index.js' in rel_path_str:
        return "Server Application Entry Point"
    
    # Determine by file name and content
    file_name = rel_path.name.lower()
    
    if file_name in ['readme.md', 'readme.rst', 'readme.txt']:
        return "Documentation"
    
    if 'package.json' in file_name:
        return "Package Configuration"
    
    if file_name == '.env.example':
        return "Environment Configuration Example"
    
    if file_name == '.oxlintrc.json':
        return "Linting Configuration"
    
    if 'vite.config.js' in file_name:
        return "Build Tool Configuration"
    
    if 'Dockerfile' in file_name:
        return "Docker Container Configuration"
    
    # Default: use the file path with formatting
    rel_path_str = str(rel_path)
    
    # Handle .js/.jsx files specially
    if file_name.endswith('.js') or file_name.endswith('.jsx'):
        if rel_path_str.startswith('server/routes/'):
            return f"Server API Route: {file_path.split('/')[-1].replace('.js', '')}"
        elif rel_path_str.startswith('server/models/'):
            return f"Server Data Models: {file_path.split('/')[-1].replace('.js', '')}"
        elif rel_path_str.startswith('client/src/pages/'):
            page_name = os.path.basename(rel_path).replace('.jsx', '')
            return f"Client Pages: {page_name.title().replace('-', ' ')}"
        elif rel_path_str.startswith('client/src/components/'):
            comp_name = os.path.basename(rel_path).replace('.jsx', '')
            return f"Client Components: {comp_name.title().replace('-', ' ')}"
        else:
            return f"Client Source: {file_path.split('/')[-1].replace('.js', '')}"
    
    elif file_name.endswith('.json'):
        if 'package-lock.json' in file_name:
            return "Package Dependencies Lock File"
        else:
            return f"JSON Configuration: {file_path.split('/')[-1]}"
    
    else:
        # For other files, use the full relative path
        return f"`{rel_path_str}`"

def count_file_lines(file_path: str, content: str) -> tuple[int, int]:
    """Count total lines and non-empty lines in a file."""
    lines = content.splitlines()
    total_lines = len(lines)
    non_empty_lines = len([l for l in lines if l.strip()])
    return total_lines, non_empty_lines

def format_file_content(content: str) -> str:
    """Format file content for display in dump."""
    # For large files, add a note about size
    lines = content.splitlines()
    if len(lines) > 500:
        return f"```\n{content[:2000]}...\n(Showing first 2000 chars of {len(content)} total chars)\n```"
    else:
        return f"```\n{content}\n```"

def generate_organized_dump():
    """Generate the organized dump by iterating through files."""
    output_lines = []
    
    # Add header
    output_lines.append("# Matchalize — Full Codebase Dump")
    output_lines.append("")
    output_lines.append("> Verbatim contents of all project source and configuration files.")
    output_lines.append("> Generated with latest changes applied.")
    output_lines.append("")
    
    # Organize files by type and location
    for project_root in PROJECT_ROOTS:
        project_name = project_root.name
        output_lines.append(f"## {project_name.title()} Files")
        output_lines.append("")
        
        # Process all files in the project
        files = []
        
        for root, dirs, filenames in os.walk(project_root):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if not any(ex in root.replace(str(BASE_DIR), '') for ex in EXCLUDE_DIRS)]
            
            # Process files
            for file_name in filenames:
                file_path = os.path.join(root, file_name)
                
                # Get relative path for display
                rel_path = os.path.relpath(file_path, BASE_DIR)
                
                # Get file extension
                file_ext = os.path.splitext(file_name)[0].lower()
                
                # Check if we should include this file
                if not should_include_file(file_path):
                    continue
                
                # Special handling for pattern files
                if '.*' in file_name and len(file_ext) == 0:
                    if file_name not in ['.env', '.env.example']:
                        continue
                
                # Read file content
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    content = f"// ERROR reading file: {e}"
                
                # Get file info
                total_lines, non_empty_lines = count_file_lines(file_path, content)
                
                # Determine section title
                section_title = get_file_section_title(file_path, content.splitlines())
                
                # Build the section
                output_lines.append(f"### {rel_path}")
                output_lines.append(f"**Type:** {section_title}")
                output_lines.append(f"**Size:** {total_lines} lines ({non_empty_lines} non-empty)")
                output_lines.append("")
                
                if len(content) > 3000:
                    # For very large files, show summary
                    display_content = f"```\n{content[:1500]}...\n\n(Showing first 1500 chars of {total_lines} total lines)\n```"
                else:
                    display_content = f"```\n{content}\n```"
                
                output_lines.append(display_content)
                output_lines.append("")
        
        # Add separator between projects
        output_lines.append("---\n")
    
    # Write to file
    output_file = BASE_DIR / "matchalize_full_dump.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(output_lines))
    
    print(f"✅ Generated {len(output_lines)} lines in {output_file}")
    print(f"📊 File size: {os.path.getsize(output_file):,} bytes")


def generate_server_only_dump():
    """Generate the server-only dump."""
    output_lines = []
    
    # Add header
    output_lines.append("# Matchalize — Server Codebase Dump")
    output_lines.append("")
    output_lines.append("> Verbatim contents of all server source and configuration files.")
    output_lines.append("> Generated with latest changes applied.")
    output_lines.append("> Excludes: .env, node_modules/, uploads/, dist/, build/, and package-lock.json.")
    output_lines.append("")
    
    # Process server directory
    server_dir = BASE_DIR / "server"
    files = []
    
    for root, dirs, filenames in os.walk(server_dir):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not any(ex in root.replace(str(BASE_DIR), '') for ex in EXCLUDE_DIRS)]
        
        # Process files
        for file_name in filenames:
            # Skip package-lock.json for server dump
            if file_name == "package-lock.json":
                continue
            
            file_path = os.path.join(root, file_name)
            rel_path = os.path.relpath(file_path, BASE_DIR)
            
            # Get file extension
            file_ext = os.path.splitext(file_name)[0].lower()
            
            # Check if we should include this file
            if not should_include_file(file_path):
                continue
            
            # Read file content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                content = f"// ERROR reading file: {e}"
            
            # Get file info
            total_lines, non_empty_lines = count_file_lines(file_path, content)
            
            # Determine section title
            section_title = get_file_section_title(file_path, content.splitlines())
            
            # Format content
            if len(content) > 3000:
                content_snippet = content[:2000]
                display_content = f"```\n{content_snippet}...\n\n(Showing first 2000 chars of {total_lines} total lines)\n```"
            else:
                display_content = f"```\n{content}\n```"
            
            # Build the section
            output_lines.append(f"### {rel_path}")
            output_lines.append(f"**Type:** {section_title}")
            output_lines.append(f"**Size:** {total_lines} lines ({non_empty_lines} non-empty)")
            output_lines.append("")
            output_lines.append(display_content)
            output_lines.append("")
    
    # Write to file
    output_file = BASE_DIR / "server_dump.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(output_lines))
    
    print(f"✅ Generated {len(output_lines)} lines in {output_file}")
    print(f"📊 File size: {os.path.getsize(output_file):,} bytes")


if __name__ == "__main__":
    print("🔄 Regenerating codebase dumps...")
    print(f"📂 Base directory: {BASE_DIR}")
    print(f"📁 Scan locations: {[str(p) for p in PROJECT_ROOTS]}")
    print("")
    
    # Generate full dump
    generate_organized_dump()
    
    print("\n" + "="*60 + "\n")
    
    # Generate server dump
    generate_server_only_dump()
    
    print("\n" + "="*60)
    print("✅ Dump generation complete!")
    print("📄 Generated files:")
    print(f"  - {BASE_DIR / 'matchalize_full_dump.md'}")
    print(f"  - {BASE_DIR / 'server_dump.md'}")
