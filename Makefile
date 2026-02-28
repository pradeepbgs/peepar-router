# Router Release Makefile

VERSION := $(shell node -p "require('./package.json').version")

.PHONY: patch minor major tag push release publish

patch:
	@echo "Bumping patch version..."
	npm version patch
# 	@git add package.json
# 	@git commit -m "chore: bump version (patch)"
	@$(MAKE) tag

minor:
	@echo "Bumping minor version..."
	npm version minor
# 	@git add package.json
# 	@git commit -m "chore: bump version (minor)"
	@$(MAKE) tag

major:
	@echo "Bumping major version..."
	npm version major
# 	@git add package.json
# 	@git commit -m "chore: bump version (major)"
	@$(MAKE) tag

tag:
	@NEW_VERSION=$$(node -p "require('./package.json').version") && \
	echo "Tagging v$$NEW_VERSION" && \
	git tag v$$NEW_VERSION

push:
	git push origin main
	git push --tags

release: push
	@echo "Release pushed with tags."

publish:
	npm publish