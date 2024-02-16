import {Builder, By, Key, until, WebDriver, WebElement} from 'selenium-webdriver'
import config from 'config'
import {assert} from 'chai'
import * as chrome from 'selenium-webdriver/chrome'
import ncp from 'copy-paste'

const waitUntilClickable = async (driver: WebDriver, element: WebElement) => {
    await driver.wait(until.elementIsVisible(element))
    await driver.wait(until.elementIsEnabled(element))
}
const logInDocs = async function (driver: WebDriver) {
    await driver?.get('https://docs.google.com/document/u/0/')

    {
        const emailInput = await driver.findElement(By.name('identifier'))

        await emailInput.sendKeys(config.get('user.email'))

        const btnNext = await driver.findElement(By.css('#identifierNext > div > button'))
        await btnNext.click()
    }
    {
        const passwordInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="password"]/div[1]/div/div[1]/input')))
        await waitUntilClickable(driver, passwordInput)
        await passwordInput.sendKeys(config.get('user.password'))

        const btnNext = await driver.wait(until.elementLocated(By.css('#passwordNext > div > button')))
        await btnNext.click()
    }
}
describe('Auth functionality', async function () {
    this.timeout(0)
    const options = new chrome.Options();
    const DOC_NAME = ''.concat(config.get('document.name'),'_',Math.round(Math.random()*1e6).toString());
    options.addArguments('start-maximized');
    options.setChromeBinaryPath('C:\\browserdrivers\\chrome-win64\\chrome.exe')

    let driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    beforeEach(async function () {

        driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        (await driver.manage().getTimeouts()).implicit = 10e3;
        (await driver.manage().getTimeouts()).pageLoad = 10e3;
        (await driver.manage().getTimeouts()).script = 10e3;
    })
    afterEach(async function () {
        await driver.close()
        await driver.quit()
    })

    it.skip('Login with valid credentials', async function () {

        await logInDocs(driver);
        const profileLinkContainer = await driver.wait(until.elementLocated(By.xpath('//*[@id="gb"]/div[2]/div[3]/div[1]/div[2]')), 10e3)
        const profileLink = profileLinkContainer.findElement(By.tagName('a'))
        assert.match(await profileLink.getAttribute('aria-label'), /Вайсов/, 'Profile link not found');
    })

    it.skip('Create document as a log-ined user', async function () {
        await logInDocs(driver);
        {
            const newDocClickableDiv = await driver.wait(until.elementLocated(By.css('#\\:20 > div.docs-homescreen-templates-templateview-preview.docs-homescreen-templates-templateview-preview-showcase')))
            await newDocClickableDiv.click()
        }
        {
            const docsTitleInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="docs-title-widget"]/input')))
            await docsTitleInput.clear()

            await docsTitleInput.sendKeys(DOC_NAME, Key.ENTER);

            const saveIndicator = await driver.wait(until.elementLocated(By.id('docs-folder')))
            await driver.wait(until.elementIsVisible(saveIndicator))

            const mainMenuLinkContainer = await driver.wait(until.elementLocated(By.id('docs-branding-container')))
            const mainMenuLink = await mainMenuLinkContainer.findElement(By.tagName('a'))
            await mainMenuLink.click()
        }
        assert.exists(await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class, 'docs-homescreen-grid-item-title') and @title='${DOC_NAME}']`))))
    })

    it.skip('Search document by name', async function () {
        await logInDocs(driver);
        {
            const input = await driver.wait(until.elementLocated(By.xpath('//*[@id="gb"]/div[2]/div[2]/div/form/div/input')))
            await waitUntilClickable(driver, input)

            await input.clear()

            await input.sendKeys(DOC_NAME, Key.ENTER);

            const gridItemWithDocName = await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class, 'docs-homescreen-grid-item-title') and @title='${DOC_NAME}']`)))
            assert.exists(gridItemWithDocName)
        }
    })

    it.skip('Delete a document', async function () {
        await logInDocs(driver);
        {
            const docCard = await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class, 'docs-homescreen-grid-item-title') and @title='${DOC_NAME}']`)))
            await waitUntilClickable(driver, docCard)
            await docCard.click()

            const fileMenu = await driver.wait(until.elementLocated(By.id('docs-file-menu')))
            await waitUntilClickable(driver, fileMenu)
            await fileMenu.click()

            const deleteBtn = await driver.wait(until.elementLocated(By.id(':6j')))
            await waitUntilClickable(driver, deleteBtn);
            await deleteBtn.click()

            const confirmationDialog = await driver.wait(until.elementLocated(By.xpath('/html/body/div[62]')))
            assert.exists(confirmationDialog)
        }
        {
            await driver.navigate().to('https://drive.google.com/')

            const trashBtn = await driver.wait(until.elementLocated(By.id('nt:DriveDocli')))
            await waitUntilClickable(driver, trashBtn);
            await trashBtn.click();

            const gridCell = await driver.wait(until.elementLocated(By.xpath('//*[@id=":24"]/div/c-wiz/c-wiz/div[1]/div/c-wiz/div[2]/c-wiz/div[1]/c-wiz/c-wiz/div/c-wiz/div/div/div/div[2]/div/div')))
            assert.deepStrictEqual(await gridCell.getText(), DOC_NAME)
        }
    })

    it('Edit a document', async function () {
        await logInDocs(driver);
        {
            const docCard = await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class, 'docs-homescreen-grid-item-title') and @title='${DOC_NAME}']`)))
            await waitUntilClickable(driver, docCard)
            await docCard.click()
        }

        const canvas = await driver.wait(until.elementLocated(By.css('#kix-appview > div.kix-appview-editor-container > div > div:nth-child(1) > div.kix-rotatingtilemanager.docs-ui-hit-region-surface > div > div > canvas')))
        {
            await waitUntilClickable(driver, canvas)
            await canvas.click()
            await driver.actions()
                .keyDown(Key.CONTROL).keyDown('a').keyUp('a').keyUp(Key.CONTROL)
                .keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE)
                .sendKeys(DOC_NAME).perform()
        }
        {
            await driver.actions()
                .keyDown(Key.CONTROL).keyDown('a').keyUp('a')
                .keyDown('c').keyUp('c').perform()

            const buf = ncp.paste()
            assert.strictEqual(buf.substring(0,buf.length-2),DOC_NAME)
        }
    })
})
