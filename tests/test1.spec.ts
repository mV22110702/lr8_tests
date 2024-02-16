import {Actions, Builder, Button, By, until,Key, WebDriver} from 'selenium-webdriver'
import config from 'config'
import {assert} from 'chai'
import * as chrome from 'selenium-webdriver/chrome'
import {Keyboard} from "selenium-webdriver/lib/input";
import {KeyObject} from "crypto";

const logInDocs = async function(driver:WebDriver){
    await driver?.get('https://docs.google.com/document/u/0/')

    {
        const emailInput = await driver.findElement(By.name('identifier'))
        await driver.wait(until.elementIsVisible(emailInput))
        await driver.wait(until.elementIsEnabled(emailInput))
        await emailInput.sendKeys(config.get('user.email'))

        const btnNext = await driver.findElement(By.css('#identifierNext > div > button'))
        await btnNext.click()
    }
    {
        const passwordInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="password"]/div[1]/div/div[1]/input')))
        await driver.wait(until.elementIsVisible(passwordInput))
        await driver.wait(until.elementIsEnabled(passwordInput))
        await passwordInput.sendKeys(config.get('user.password'))

        const btnNext = await driver.wait(until.elementLocated(By.css('#passwordNext > div > button')))
        await btnNext.click()
    }
}
describe('Auth functionality', async function () {
    this.timeout(0)
    const options = new chrome.Options();
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
        (await driver.manage().getTimeouts()).implicit = 20e3;
        (await driver.manage().getTimeouts()).pageLoad = 20e3;
        (await driver.manage().getTimeouts()).script = 20e3;
    })
    afterEach(async function () {
        // await driver.close()
        // await driver.quit()
    })

    it.skip('Login with valid credentials', async function () {

        await logInDocs(driver);
        const profileLinkContainer = await driver.wait(until.elementLocated(By.xpath('//*[@id="gb"]/div[2]/div[3]/div[1]/div[2]')),10e3)
        const profileLink = profileLinkContainer.findElement(By.tagName('a'))
        assert.match(await profileLink.getAttribute('aria-label'),/Вайсов/,'Profile link not found');
    })

    it('Create document as a logined user',async function(){
        await logInDocs(driver);
        {
            const newDocClickableDiv = await driver.wait(until.elementLocated(By.css('#\\:20 > div.docs-homescreen-templates-templateview-preview.docs-homescreen-templates-templateview-preview-showcase')))
            await newDocClickableDiv.click()
        }
        {
            const docsTitleInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="docs-title-widget"]/input')))
            await docsTitleInput.clear()
            const docName = ''.concat(config.get('document.name'),'_',Math.round(Math.random()*1e6).toString());
            await docsTitleInput.sendKeys(docName,Key.ENTER);

            const saveIndicator = await driver.wait(until.elementLocated(By.id('docs-folder')))
            await driver.wait(until.elementIsVisible(saveIndicator))

            const mainMenuLinkContainer = await driver.wait(until.elementLocated(By.id('docs-branding-container')))
            const mainMenuLink = await mainMenuLinkContainer.findElement(By.tagName('a'))
            await mainMenuLink.click()

            assert.exists(await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class, 'docs-homescreen-grid-item-title') and @title='${docName}']`))))
        }
    })
})
