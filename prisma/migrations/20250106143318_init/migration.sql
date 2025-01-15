-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "parentCourseId" INTEGER,
ADD COLUMN     "videoUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_parentCourseId_fkey" FOREIGN KEY ("parentCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
